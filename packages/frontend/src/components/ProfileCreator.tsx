'use client';

import { useState } from 'react';
import {
  useCreateProfile,
  useSession,
  SessionType,
  isValidHandle,
} from '@lens-protocol/react-web';
import { useAccount } from 'wagmi';

export default function ProfileCreator() {
  const [handle, setHandle] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { address } = useAccount(); // Get the connected wallet address
  const { data: session } = useSession();

  const { execute: createProfile, loading: isCreating, error: createError } = useCreateProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!address) {
      setFeedback('⚠️ Wallet not connected. Please connect your wallet first.');
      console.warn('[ProfileCreator] handleSubmit called but no address found.');
      return;
    }
    if (!handle.trim()) {
      setFeedback('⚠️ Please enter a handle.');
      return;
    }
    
    const localHandleName = handle.endsWith('.test') ? handle.slice(0, -5) : handle;
    if (!isValidHandle(localHandleName)) {
        setFeedback('⚠️ Invalid handle format. Use a-z, 0-9, underscores. Length 5-31. Example: mycoolhandle');
        return;
    }

    console.log(`[ProfileCreator] Attempting to create profile for handle (local part): ${localHandleName}`);
    console.log(`[ProfileCreator] Wallet address for 'to' field: ${address}`);
    setFeedback('Creating profile...');

    try {
      const result = await createProfile({
        handle: localHandleName,
        to: address, // Explicitly set the owner of the new profile to the connected address
        // metadata: undefined, // Can add later
        // followPolicy: undefined, // Can set later
      });

      console.log('[ProfileCreator] Create profile result:', result);

      if (result.isSuccess()) {
        setFeedback(`✅ Profile creation initiated! TxHash: ${result.value.txHash}. Refresh after confirmation.`);
        setHandle('');
      } else {
        console.error('[ProfileCreator] Failed to create profile:', result.error);
        setFeedback(`❌ Error creating profile: ${result.error.message}. Handle might be taken/invalid or an issue occurred.`);
      }
    } catch (err: any) {
      console.error('[ProfileCreator] Exception during profile creation:', err);
      setFeedback(`❌ Unexpected error: ${err.message}`);
    }
  };

  if (session?.type === SessionType.WithProfile) {
    return (
      <div className="my-4 p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-md">
        <p className="text-sm text-green-700 dark:text-green-300">
          You are already logged in with profile: @{session.profile.handle?.fullHandle || session.profile.id}
        </p>
      </div>
    );
  }

  if (!address) {
     return (
        <div className="my-4 p-3 bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-md">
            <p className="text-sm text-amber-700 dark:text-amber-300">Please connect your wallet first to create a profile.</p>
        </div>
     )
  }

  return (
    <div className="my-6 p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Create a New Lens Profile (Testnet)</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Desired Handle (e.g., yourusername)
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="handle"
              name="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="yourcoolhandle"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isCreating}
            />
            <span className="px-3 py-2 border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-r-md">
              .test
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter the local part of your desired handle. It will be registered as handle.test on Lens Testnet.
          </p>
        </div>

        {feedback && (
          <p className={`text-sm ${(createError && feedback.startsWith('❌')) || feedback.startsWith('⚠️') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {feedback}
          </p>
        )}
        {createError && !feedback?.startsWith('❌') &&(
             <p className="text-sm text-red-500 dark:text-red-400">Hook Error: {createError.message}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isCreating || !handle.trim() || !address}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:text-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isCreating ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </div>
      </form>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Note: Profile creation is an on-chain transaction and requires gas (GRASS on Lens Chain Sepolia).
      </p>
    </div>
  );
}
