import { useState } from 'react';

import {
  post,
  fetchAccount,
  fetchAccountsAvailable,
  createAccountWithUsername,
  currentSession,
  fetchPostReferences,
  executePostAction
} from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { blockchainData, evmAddress, postId, uri, PostReferenceType } from "@lens-protocol/client";
import { never } from "@lens-protocol/client";
import { storageClient } from "./storage-client";
import { client } from "./client";
import { useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { account as makeMetadata } from "@lens-protocol/metadata";
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
    setFeedback('Checking Lens session...');

    try {


      // Attempt to resume previous session
      //const resumed = await client.resumeSession();
      //log('resumeSession result:', resumed);

      let currentClient;
      const resumed = await client.resumeSession();
      if (resumed.isErr()) {
        return console.error(resumed.error);
      }

      // SessionClient: { ... }

      currentClient = resumed.value;
      const resumedSessionDetails = await currentSession(currentClient);
      if (resumedSessionDetails.value.signer.toLowerCase() !== address.toLowerCase()) {
        console.warn("Loging out from previous session")
        await currentClient.logout();
        currentClient = null;
      }
      console.warn("Making session")
      if (!currentClient) {
        const loginResult = await client.login({
          onboardingUser: { wallet: address as `0x${string}` },
          signMessage: async (message: string) => {
            log('Signing Lens challenge message...');
            return signMessageAsync({ message });
          },
        });
        if (loginResult.isErr()) {
          error('Login failed:', loginResult.error.message);
          setFeedback(`Login error: ${loginResult.error.message}`);
          setIsCheckingLensSession(false);
          return;
        }
        currentClient = loginResult.value;
      }

      log('Login succeeded, obtained new session client.');
      setSessionClient(currentClient);
      // Fetch existing Lens accounts for this wallet
      const result = await fetchAccountsAvailable(currentClient, {
        managedBy: evmAddress(address as `0x${string}`),
        includeOwned: true,
      });
      if (result.isErr()) {
        error('Error fetching available accounts:', result.error);
        setFeedback('Error retrieving Lens accounts.');
        setIsCheckingLensSession(false);
        return;
      }
      log('fetchAccountsAvailable returned:', result.value);

      const savedAccount = result.value.items[0]?.account;
      if (!savedAccount) {
        log('No Lens profiles found for this wallet.');
        setActiveLensProfile(null);
        setFeedback('You need to create a Lens profile!');
      }
      if (savedAccount) {
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
      } else {
        setActiveLensProfile(null);
        setFeedback('No Lens profile found. Please create one.');
      }
    } catch (err: any) {
      warn('Error during session check:', err.message);
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
    questionId: string,      // was `postId` before
    winnerAddress: string
  ) => {
    setFeedback(null);
    console.log('[useSessionClient] handleAssignResponseWinner triggered.');

    if (!sessionClient) return;
    if (!isConnected || !activeLensProfile) {
      const msg = '⚠️ Please log in with an active Lens Profile first.';
      setFeedback(msg);
      console.warn(`[useSessionClient] ${msg}`);
      return;
    }

    setFeedback('Preparing transaction…');
    setIsPosting(true);
    console.log('[useSessionClient] feedAddress:', feedAddress);
    console.log('[useSessionClient] questionId:', questionId);
    console.log('[useSessionClient] winnerAddress:', winnerAddress);

    const metadata = textOnly({
      content: "content",
      tags: ["question", "lens-task-test-v2"],
    });

    // — build the single key/value param your Solidity expects —
    const coder = AbiCoder.defaultAbiCoder();
    const keyHash = keccak256(toUtf8Bytes('winner'));            // keccak("winner")
    // const key     = blockchainData(keyHash);
    const data = blockchainData(coder.encode(['address'], [winnerAddress]));

    try {
      // const result = await executePostAction(sessionClient, {
      //   post: postId(questionId),      // now calls the helper, not your param
      //   action: {
      //     unknown: {
      //       address: evmAddress(getPostActionAddress(chainId)),
      //       params: [
      //         {
      //           raw: {
      //             // 32 bytes key (e.g., keccak(name))
      //             key: blockchainData(keccak256(toUtf8Bytes('winner')),
      //             // an ABI encoded value
      //             value: blockchainData(coder.encode(['address'], [winnerAddress])),
      //           },
      //         },
      //       ],
      //     },
      //   },
      // });


      const postExecuteAction = {
        post: postId(questionId.toString()),  
        action: {
          unknown: {
            address: evmAddress(getPostActionAddress(chainId)),
            params: [
              {
                // top-level key + data, no `raw` wrapper
                key: blockchainData(keccak256(toUtf8Bytes("winner"))),
                data: blockchainData(
                  coder.encode(["address"], [winnerAddress])
                ),
              },
            ],
          },
        },
      };
      
      // (If you need to upload metadata first, do that before executing the action)
      const { uri: uriResult } = await storageClient.uploadAsJson(metadata);
      
      const result = await executePostAction(sessionClient, postExecuteAction)
      .andThen(handleOperationWith(walletClient));


      if (result.isErr()) {
        console.error(result.error);
        setFeedback(`❌ Error assigning bounty: ${result.error.message}`);
      } else {
        console.log('✅ Bounty winner assigned:', result.value);
        setFeedback('✅ Bounty winner assigned!');
      }
    } catch (err: any) {
      console.error(err);
      setFeedback(`❌ Unexpected error: ${err.message || err}`);
    } finally {
      setIsPosting(false);
    }
  };

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
      tags: ["question", "lens-task-test-v2"],
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
      tags: ["answer", "lens-task-test-v2"],

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