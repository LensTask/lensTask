import { useState, useEffect } from 'react';

import { fetchAccount, fetchAccountsAvailable, createAccountWithUsername } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { evmAddress } from "@lens-protocol/client";
import { uri } from "@lens-protocol/client";
import { never } from "@lens-protocol/client";
import { storageClient } from "./storage-client";
import { client } from "./client";
import { useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { account as makeMetadata } from "@lens-protocol/metadata";

const useSessionClient = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();

  const [sessionClient, setSessionClient] = useState();
  const [activeLensProfile, setActiveLensProfile] = useState(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCheckingLensSession, setIsCheckingLensSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameSignUp, setUsernameSignUp] = useState<string | undefined>(undefined);

  const [isPosting, setIsPosting] = useState(false);

  const log = (...args: any[]) => console.log('[useSessionClient]', ...args);
  const warn = (...args: any[]) => console.warn('[useSessionClient]', ...args);
  const error = (...args: any[]) => console.error('[useSessionClient]', ...args);

  const checkCurrentLensSession = async () => {
    if (!isConnected || !address) {
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
      // Fetch existing Lens accounts for this wallet
      const result = await fetchAccountsAvailable(client, {
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
      }

      // Attempt to resume previous session
      const resumed = await client.resumeSession();
      log('resumeSession result:', resumed);

      let currentClient;
      if (resumed && !resumed.isErr()) {
        currentClient = resumed.value;
        log('Resumed existing session client.');
      } else {
        log('No valid session found, performing new login.');
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
        log('Login succeeded, obtained new session client.');
      }

      setSessionClient(currentClient);

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

  const handleProfileCreation = async () => {
    if (!sessionClient || !usernameSignUp) {
      error('Missing session client or username for profile creation.');
      return;
    }

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
        current:
        sessionClient.switchAccount({ account: accountData?.address ?? never('No account address') });
        setActiveLensProfile(accountData);
        log('Profile creation complete, switched to new account:', accountData?.username.localName);
      });

    if (result.isErr()) {
      error('Error creating profile:', result.error);
      setFeedback(`Profile creation failed: ${result.error.message}`);
    }
  };

  const handleLoginOrCreateWithLens = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isConnected || !address) {
      setFeedback('⚠️ Wallet not connected. Please connect your wallet first.');
      return;
    }

    log('Initiating login/onboarding flow for wallet:', address);
    setFeedback(`Processing Lens Protocol login for wallet: ${address.substring(0, 6)}...`);
    setIsLoading(true);

    try {
      if (usernameSignUp && sessionClient) {
        log('Detected signup username and existing session, creating profile.');
        await handleProfileCreation();
        return;
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

      if (!activeLensProfile) {
        log('No active profile after login, awaiting profile creation.');
      }
    } catch (err: any) {
      error('Unexpected error during login/onboarding:', err.message);
      setFeedback(`❌ Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
      log('Login/onboarding flow complete.');
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      checkCurrentLensSession()
    }
  }, [isConnected, address])
  

  return {
    sessionClient,
    activeLensProfile,
    feedback,
    isCheckingLensSession,
    isLoading,
    usernameSignUp,
    setUsernameSignUp,
    handleLoginOrCreateWithLens,
    handleProfileCreation,
    checkCurrentLensSession,
  };
};

export default useSessionClient;
