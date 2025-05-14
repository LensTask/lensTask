import { useState, useEffect } from 'react';

import {
  fetchAccount,
  fetchAccountsAvailable,
  createAccountWithUsername,
} from '@lens-protocol/client/actions';
import { evmAddress, uri, never } from '@lens-protocol/client';
import { handleOperationWith } from '@lens-protocol/client/viem';

import { storageClient } from './storage-client';
import { client } from './client';
import { useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { account as makeMetadata } from '@lens-protocol/metadata';

/**
 * Hook that manages Lens sessions and profile creation.
 *
 * – Uses only `includeOwned` when fetching accounts (no manager filter).
 * – Removes the unsupported `managers` field from `createAccountWithUsername`.
 * – Correct `handleOperationWith` import path.
 */
const useSessionClient = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: walletClient } = useWalletClient();

  const [sessionClient, setSessionClient] = useState<_SessionClient | undefined>();
  const [activeLensProfile, setActiveLensProfile] = useState<Account | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCheckingLensSession, setIsCheckingLensSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameSignUp, setUsernameSignUp] = useState<string | undefined>();

  const log = (...args: any[]) => console.log('[useSessionClient]', ...args);
  const warn = (...args: any[]) => console.warn('[useSessionClient]', ...args);
  const error = (...args: any[]) => console.error('[useSessionClient]', ...args);

  /** Wait until the indexer picks up the new account. */
  const fetchAccountWhenIndexed = async (txHash: string) => {
    const MAX_RETRIES = 5;
    for (let i = 0; i < MAX_RETRIES; i++) {
      const accountRes = await fetchAccount(sessionClient!, { txHash });
      if (accountRes) return accountRes;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return undefined;
  };

  const checkCurrentLensSession = async () => {
    if (!isConnected || !address) {
      setActiveLensProfile(null);
      setFeedback(null);
      setIsCheckingLensSession(false);
      return;
    }

    setIsCheckingLensSession(true);
    setFeedback('Checking Lens session…');

    try {
      const result = await fetchAccountsAvailable(client, {
        managedBy: evmAddress(address as `0x${string}`), // required by API
        includeOwned: true, // also return accounts you *own* even if not manager
      });

      if (result.isErr()) {
        error('Error fetching accounts:', result.error);
        setFeedback('Error retrieving Lens accounts.');
        return;
      }

      const savedAccount = result.value.items.find(
        (i) => i.account.owner.toLowerCase() === address.toLowerCase(),
      )?.account;

      const resumed = await client.resumeSession();
      if (resumed && !resumed.isErr()) {
        setSessionClient(resumed.value);
      }

      if (savedAccount) {
        resumed.value.switchAccount({ account: savedAccount.address });
        setActiveLensProfile(savedAccount);
        setFeedback(`✅ Welcome back, @${savedAccount.username?.localName}!`);
      } else {
        setActiveLensProfile(null);
        setFeedback('No Lens profile found. Please create one.');
      }
    } catch (err: any) {
      warn('Session check error:', err.message);
      setActiveLensProfile(null);
      setFeedback('Could not determine Lens session status.');
    } finally {
      setIsCheckingLensSession(false);
    }
  };

  const handleProfileCreation = async () => {
    if (!sessionClient || !usernameSignUp) {
      error('Missing session client or username.');
      return;
    }

    const metadata = makeMetadata({ name: usernameSignUp });
    const { uri: metadataUri } = await storageClient.uploadAsJson(metadata);

    if (!walletClient) {
      error('Wallet client not available.');
      return;
    }

    const result = await createAccountWithUsername(sessionClient, {
      username: { localName: usernameSignUp },
      metadataUri: uri(metadataUri),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen(fetchAccountWhenIndexed)
      .andThen((accountData) => {
        sessionClient.switchAccount({ account: accountData?.address ?? never('No account') });
        setActiveLensProfile(accountData);
      });

    if (result.isErr()) {
      error('Profile creation failed:', result.error);
      setFeedback(`Profile creation failed: ${result.error.message}`);
    }
  };

  const handleLoginOrCreateWithLens = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isConnected || !address) {
      setFeedback('⚠️ Wallet not connected.');
      return;
    }

    setIsLoading(true);

    try {
      if (usernameSignUp && sessionClient) {
        await handleProfileCreation();
        return;
      }

      const loginResult = await client.login({
        onboardingUser: { wallet: address as `0x${string}` },
        signMessage: (message: string) => signMessageAsync({ message }),
      });

      if (loginResult?.isErr && loginResult.isErr()) {
        setFeedback(`❌ Lens login error: ${loginResult.error.message}`);
        return;
      }

      if (!loginResult || !('value' in loginResult)) {
        throw new Error('Empty login result');
      }

      setSessionClient(loginResult.value);
    } catch (err: any) {
      setFeedback(`❌ Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) checkCurrentLensSession();
  }, [isConnected, address]);

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
  } as const;
};

export default useSessionClient;
