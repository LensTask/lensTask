import { useState } from 'react';

import {
  post,
  fetchAccount,
  fetchAccountsAvailable,
  createAccountWithUsername,
  currentSession,
  fetchPostReferences,
  executePostAction,
  fetchPost,
  editPost
} from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { blockchainData, evmAddress, postId, uri, PostReferenceType } from "@lens-protocol/client";
import { never } from "@lens-protocol/client";
import { storageClient } from "./storage-client";
import { client } from "./client";
import { useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { account as makeMetadata, MetadataAttributeType } from "@lens-protocol/metadata";
import { textOnly } from "@lens-protocol/metadata";
import { getNftAddress, getPostActionAddress } from './utils';
import { AbiCoder, keccak256, toUtf8Bytes } from "ethers";

import { idchain } from 'viem/chains';

const useSessionClient = () => {
  const { address, isConnected, chainId } = useAccount();
  // console.log('[useSessionClient] useAccount', { address, isConnected });

  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();
  const [sessionClient, setSessionClient] = useState();
  const [activeLensProfile, setActiveLensProfile] = useState(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCheckingLensSession, setIsCheckingLensSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // Posts //
  const [isPosting, setIsPosting] = useState(false); // Local loading state



  const log = (...args: any[]) => console.log('[useSessionClient]', ...args);
  const warn = (...args: any[]) => console.warn('[useSessionClient]', ...args);
  const error = (...args: any[]) => console.error('[useSessionClient]', ...args);

  const checkCurrentLensSession = async () => {
    if (!address) {
      log('Wallet not connected, clearing session state.');
      setActiveLensProfile(null);
      setFeedback(null);
      setIsCheckingLensSession(false);
      return;
    }
  
    log('Starting session check for address:', address);
    setIsCheckingLensSession(true);
    setFeedback('checking Lens status…');
  
    try {
      let currentClient: SessionClient | null = null;
  
      // 1️⃣ Try to resume an existing session
      const resumed = await client.resumeSession();
      if (resumed.isOk()) {
        currentClient = resumed.value;
        log('Resumed existing session.');
      } else {
        console.warn('No saved session to resume:', resumed.error.name);
      }
  
      // 2️⃣ If we have a resumed client, verify the signer still matches
      if (currentClient) {
        const details = await currentSession(currentClient);
        if (
          details.isErr() ||
          details.value.signer.toLowerCase() !== address.toLowerCase()
        ) {
          log('Resumed session signer mismatch, logging out.');
          await currentClient.logout();
          currentClient = null;
        }
      }
  
      // 3️⃣ If no resumed client, do a fresh login
      if (!currentClient) {
        log('Logging in to Lens…');
        const loginResult = await client.login({
          onboardingUser: { wallet: address as `0x${string}` },
          signMessage: async (message: string) => {
            log('Signing Lens challenge message…');
            return signMessageAsync({ message });
          },
        });
        if (loginResult.isErr()) {
          error('Login failed:', loginResult.error.message);
          setFeedback(`Login error: ${loginResult.error.message}`);
          return;
        }
        currentClient = loginResult.value;
        log('Obtained new session client.');
      }
  
      // 4️⃣ Store the client in state
      setSessionClient(currentClient);
  
      // 5️⃣ Fetch existing Lens profiles for this wallet
      const accountsResult = await fetchAccountsAvailable(currentClient, {
        managedBy: evmAddress(address as `0x${string}`),
        includeOwned: true,
      });
      if (accountsResult.isErr()) {
        throw accountsResult.error;
      }
  
      const savedAccount = accountsResult.value.items[0]?.account;
      if (!savedAccount) {
        log('No Lens profiles found for this wallet.');
        setActiveLensProfile(null);
        setFeedback('You need to create a Lens profile!');
      } else {
        // switch to the first available account
        currentClient.switchAccount({ account: savedAccount.address });
        if (!savedAccount.username) {
          log('Found account without username, prompting for profile creation.');
          setActiveLensProfile(null);
          setFeedback('You need to create a Lens profile!');
        } else {
          setActiveLensProfile(savedAccount);
          setFeedback(`✅ Welcome back, @${savedAccount.username.localName}!`);
          log('Active profile set to:', savedAccount.username.localName);
        }
      }
    } catch (err: any) {
      warn('Error during session check:', err.message || err);
      setActiveLensProfile(null);
      setFeedback('Could not determine Lens session status.');
    } finally {
      setIsCheckingLensSession(false);
      log('Session check complete.');
    }
  };
  
  const handleProfileCreation = async (sessionClient, usernameSignUp) => {


    log('Creating metadata for username:', usernameSignUp);
    const metadata = makeMetadata({ name: usernameSignUp });
    const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);
    log('Uploaded metadata to URI:', metadataUri);

    if (!walletClient) {
      error('Wallet client not available for transaction handling.');
      return;
    }

    const result = await createAccountWithUsername(sessionClient, {
      username: { localName: usernameSignUp },
      metadataUri: uri(metadataUri),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen(async (txHash) => {
        log('Transaction confirmed with hash:', txHash);
        return fetchAccount(sessionClient, { txHash });
      })
      .andThen((accountData) => {
        sessionClient.switchAccount({ account: accountData?.address ?? never('No account address') });
        setActiveLensProfile(accountData);
        log('Profile creation complete, switched to new account:', accountData?.username.localName);
        setFeedback(`Profile creation sucessfull`);
        return accountData
      });
    if (!result) {
      setFeedback('Error creating profile');
    }
    console.log(result)
    if(result?.error){
      error('Error creating profile:', result.error);
      setFeedback(`Profile creation failed: ${result.error.message}`);
    }
    return result;
  };

  const handleLoginOrCreateWithLens = async (sessionClient, usernameSignUp) => {

    setFeedback(null);

    if (!isConnected || !address) {
      setFeedback('⚠️ Wallet not connected. Please connect your wallet first.');
      return;
    }

    log('Initiating login/onboarding flow for wallet:', address);
    setFeedback(`Processing Lens Protocol login for wallet: ${address.substring(0, 6)}...`);
    setIsLoading(true);

    try {
      if (usernameSignUp) {
        log('Detected signup username and existing session, creating profile.');

        return await handleProfileCreation(sessionClient, usernameSignUp);
      }

      const loginResult = await client.login({
        onboardingUser: { wallet: address as `0x${string}` },
        signMessage: async (message: string) => {
          log('Signing Lens challenge message...');
          return signMessageAsync({ message });
        },
      });

      if (loginResult.isErr()) {
        error('Lens login/onboarding failed:', loginResult.error.message);
        setFeedback(`❌ Lens login error: ${loginResult.error.message}`);
        return;
      }

      const newClient = loginResult.value;
      setSessionClient(newClient);
      log('Login/onboarding succeeded, session client set.');

    } catch (err: any) {
      error('Unexpected error during login/onboarding:', err.message);
      setFeedback(`❌ Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
      log('Login/onboarding flow complete.');
    }
  };
  const handleAssignResponseWinner = async (
    sessionClient,
    activeLensProfile,
    feedAddress: string,
    questionId: string,
    winnerAddress: string
  ) => {
    setFeedback(null)
    console.log('[useSessionClient] handleAssignResponseWinner triggered.')
  
    if (!isConnected || !activeLensProfile) {
      const msg = '⚠️ Please log in with an active Lens Profile first.'
      setFeedback(msg)
      console.warn(`[useSessionClient] ${msg}`)
      return
    }
  
    setFeedback('Preparing transaction…')
    setIsPosting(true)
  
    try {
      // ──────────────────────────────────────────────────────────────
      // 1️⃣  Execute the on-chain "winner" action
      // ──────────────────────────────────────────────────────────────
      const coder = AbiCoder.defaultAbiCoder()
      const postExecuteAction = {
        post: postId(questionId),
        action: {
          unknown: {
            address: evmAddress(getPostActionAddress(chainId)),
            params: [
              {
                key: blockchainData(keccak256(toUtf8Bytes('winner'))),
                data: blockchainData(
                  coder.encode(['address'], [winnerAddress])
                ),
              },
            ],
          },
        },
      }
  
      const assignResult = await executePostAction(sessionClient, postExecuteAction)
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
  
      if (assignResult.isErr()) {
        console.error(assignResult.error)
        setFeedback(`❌ Error assigning bounty: ${assignResult.error.message}`)
        return
      }
  
      // ──────────────────────────────────────────────────────────────
      // 2️⃣  Fetch the original post metadata
      // ──────────────────────────────────────────────────────────────
      const postResult = await fetchPost(client, { post: postId(questionId) })
      if (postResult.isErr() || !postResult.value) {
        const errMsg = postResult.isErr()
          ? postResult.error.message
          : 'Question post not found!'
        console.error(errMsg)
        setFeedback(`❌ Error fetching post: ${errMsg}`)
        return
      }
      const base = postResult.value.metadata
  
      // ──────────────────────────────────────────────────────────────
      // 3️⃣  Build fresh LIP-2 metadata JSON with the new "winner" attribute
      // ──────────────────────────────────────────────────────────────
      const newMetadata = textOnly({
        content: base.content,
        locale: base.locale ?? 'en',
        tags: base.tags ?? [],
        attributes: [
          ...(base.attributes ?? []),
          {
            key: 'winner',
            value: winnerAddress,
            type: MetadataAttributeType.STRING,
          },
        ],
      })
  
      // ──────────────────────────────────────────────────────────────
      // 4️⃣  Upload and get new content URI
      // ──────────────────────────────────────────────────────────────
      const { uri: newUri } = await storageClient.uploadAsJson(newMetadata)
      if (!newUri) {
        throw new Error('Failed to upload new metadata')
      }
      console.log('[useSessionClient] new metadata URI:', newUri)
  
      // ──────────────────────────────────────────────────────────────
      // 5️⃣  Edit the post, sign and wait for confirmation
      // ──────────────────────────────────────────────────────────────
      const editResult = await editPost(sessionClient, {
        post: postId(questionId),
        contentUri: uri(newUri),
      })
        .andThen(handleOperationWith(walletClient))
        .andThen(sessionClient.waitForTransaction)
  
      if (editResult.isErr()) {
        console.error(editResult.error)
        setFeedback(
          `❌ Error editing post metadata: ${editResult.error.message}`
        )
        return
      }
  
      // ──────────────────────────────────────────────────────────────
      // ✅ Done
      // ──────────────────────────────────────────────────────────────
      console.log(
        '✅ Bounty winner assigned on-chain and persisted in metadata'
      )
      setFeedback('✅ Bounty winner successfully saved!')
    } catch (err: any) {
      console.error(err)
      setFeedback(`❌ Unexpected error: ${err.message || err}`)
    } finally {
      setIsPosting(false)
    }
  }
  

  const handlePost = async (content, sessionClient, activeLensProfile) => {
    setFeedback(null); // Clear previous feedback
    console.log('[SimplePostCreator] handlePost triggered.');
    if (!sessionClient) return;
    if (!isConnected || !activeLensProfile) {
      const msg = '⚠️ Please log in with an active Lens Profile first.';
      setFeedback(msg);
      alert("Login/Connect Wallet functionality will be implemented in the Navbar."); // Placeholder
      console.warn(`[SimplePostCreator] ${msg} (Simulated)`);
      return;
    }

    if (!content.trim()) {
      const msg = '⚠️ Post content cannot be empty.';
      setFeedback(msg);
      console.warn(`[SimplePostCreator] ${msg}`);
      return;
    }

    setFeedback('Preparing post...');
    setIsPosting(true); // Set local loading state
    console.log('[SimplePostCreator] Active Profile ID for post (Simulated):', activeLensProfile.id);
    console.log('[SimplePostCreator] Content for post:', content);
    const metadata = textOnly({
      content: content,
      tags: ["question", "lens-task-test-v3"],
    });


    // Get the shared coder
    const coder = AbiCoder.defaultAbiCoder();

    const postActionData = {
      unknown: {
        address: evmAddress(getPostActionAddress(chainId)),
        params: [
          {
            raw: {
              // 32-byte key: keccak("nftAddress")
              key: blockchainData(
                "0x4a0580de8961dc8091b1b1c2d0e1d5fd69c37e2bb2ba23ada6a8099be234de72"
              ),
              // ABI-encode the NFT address into a 32-byte word
              data: blockchainData(
                coder.encode(
                  ["address"],
                  [getNftAddress(chainId)]
                )
              ),
            },
          },
        ],
      },
    };


    const { uri: uriResult } = await storageClient.uploadAsJson(metadata);
    const resultPost = await post(sessionClient, { contentUri: uri(uriResult), actions: [postActionData] });
    console.log("ResultPost:");
    console.log(resultPost)
    const simulatedSuccess = resultPost?.value?.hash ? true : false; // Change to false to test error path
    const simulatedTxOrPubId = resultPost.value?.hash

    if (simulatedSuccess && simulatedTxOrPubId) {
      const finalMsg = `✅ Post submitted! (Simulated - ID/Tx: ${simulatedTxOrPubId.substring(0, 12)}...). Refresh feed to see.`;
      setFeedback(finalMsg);
      console.log(`[SimplePostCreator] ${finalMsg}`);
    } else {
      const simulatedErrorMessage = "Simulated error: Failed to create post.";
      setFeedback(`❌ Error creating post: ${simulatedErrorMessage}`);
      console.error('[SimplePostCreator] Simulated post creation failed.');
    }
    // --- END SIMULATED POST CREATION ---

    setIsPosting(false); // Reset local loading state
  };
  const handleCommentOnPost = async (content, id, sessionClient) => {

    const metadata = textOnly({
      content: content,
      tags: ["answer", "lens-task-test-v3"],

    });

    const { uri: uriResponse } = await storageClient.uploadAsJson(metadata);
    const result = await post(sessionClient, {
      contentUri: uri(uriResponse),
      commentOn: {
        post: postId(id), // the post to comment on
      },
    });
    return result;
  }

  const getCommentsOnPost = async (id, client) => {
    const result = await fetchPostReferences(client, {
      referencedPost: postId(id),
      referenceTypes: [PostReferenceType.CommentOn],
    });

    if (result.isErr()) {
      return console.error(result.error);
    }

    // items: Array<AnyPost>
    const { items, pageInfo } = result.value;
  }

  return {
    sessionClient,
    activeLensProfile,
    feedback,
    isCheckingLensSession,
    isLoading,
    isPosting,
    handlePost,
    setIsPosting,
    handleLoginOrCreateWithLens,
    handleProfileCreation,
    checkCurrentLensSession,
    handleCommentOnPost,
    handleAssignResponseWinner,

  };
};

export default useSessionClient;