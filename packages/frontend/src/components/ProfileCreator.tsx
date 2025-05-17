'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// *** IMPORT YOUR AUTH CONTEXT HOOK ***
import { useAppContext } from '../context/useAppState';

// Your custom hook for actions
import useSessionClient from '../lib/useSessionClient';

export default function ProfileCreator() {
  const { address, isConnected, isConnecting } = useAccount();

  // *** GET AUTH STATE FROM CONTEXT ***
  const { state, actions } = useAppContext();
  const [usernameSignUp, setUsernameSignUp] = useState<string>('');

  // *** KEEP useSessionClient FOR ACTIONS AND LOCAL UI STATE ***
  const {
    feedback,
    isLoading: isLoadingAction,
    handleLoginOrCreateWithLens,
    handleAssignResponseWinner,
  } = useSessionClient();

  const [showSignUpForm, setSignUpFormActive] = useState(false);
  const [testFeed, setTestFeed] = useState('');
  const [testPostId, setTestPostId] = useState('');
  const [testWinner, setTestWinner] = useState('');

  useEffect(() => {
    if (!state.stateActiveLensProfile && isConnected && !state.isLoadingSession) {
      setUsernameSignUp('');
      setSignUpFormActive(true);
    } else if (state.stateActiveLensProfile) {
      setSignUpFormActive(false);
    }
  }, [state.stateActiveLensProfile, isConnected, state.isLoadingSession]);

  // Loading states
  if (isConnecting || state.isLoadingSession) {
    return (
      <div className="my-4 p-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center animate-pulse">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isConnecting ? 'Connecting to wallet...' : 'Checking Lens status...'}
        </p>
      </div>
    );
  }

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-200 mb-3">
          Please connect your wallet to interact with Lens Protocol.
        </p>
        <ConnectKitButton />
      </div>
    );
  }

  // Active Lens Profile detected
  if (state.stateActiveLensProfile) {
    const displayHandle = state.stateActiveLensProfile.username?.localName;
    return (
      <>
        <div className="my-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg text-center">
          <p className="text-sm text-green-700 dark:text-green-200">
            Welcome! Interacting as: <br />
            <strong className="font-medium">@{displayHandle}</strong>
          </p>
        </div>
        {/* Debug Panel */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border rounded text-xs">
          <h4 className="font-semibold mb-2">Debug Panel</h4>
          <pre className="overflow-auto bg-black bg-opacity-10 p-2 rounded">
            {JSON.stringify(
              {
                isConnected,
                isConnecting,
                isLoadingSession: state.isLoadingSession,
                sessionClientSet: !!state.stateSessionClient,
                profileSet: !!state.stateActiveLensProfile,
              },
              null,
              2
            )}
          </pre>
        </div>
        {/* Assign Bounty Winner */}
        <div className="mt-4 p-4 border-t dark:border-slate-700">
          <h5 className="text-lg font-semibold mb-2">Assign Bounty Winner</h5>
          <input
            type="text"
            placeholder="Feed address"
            value={testFeed}
            onChange={(e) => setTestFeed(e.target.value)}
            className="mb-2 block w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
          />
          <input
            type="number"
            placeholder="Post ID"
            value={testPostId}
            onChange={(e) => setTestPostId(e.target.value)}
            className="mb-2 block w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
          />
          <input
            type="text"
            placeholder="Winner address"
            value={testWinner}
            onChange={(e) => setTestWinner(e.target.value)}
            className="mb-4 block w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
          />
          <button
            onClick={() => handleAssignResponseWinner(testFeed, Number(testPostId), testWinner)}
            disabled={!testFeed || !testPostId || !testWinner}
            className="w-full inline-flex justify-center rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Assign Bounty
          </button>
        </div>
      </>
    );
  }

  // Modal for users without a Lens profile
  return showSignUpForm ? (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setSignUpFormActive(false)}
      />
      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-lg p-6">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setSignUpFormActive(false)}
          >
            &times;
          </button>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Login or Create Profile with Lens
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Wallet: <code className="text-xs bg-slate-100 dark:bg-slate-700 p-0.5 rounded">{address?.substring(0, 6)}...{address?.substring(address.length - 4)}</code>.
            <br />
            {feedback || 'Click below to sign in with Lens or create a new profile.'}
          </p>
          <form
            className="space-y-4 border-b dark:border-slate-700 pb-6 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200">
              Create a New Lens Profile
            </h4>
            <div>
              <label
                htmlFor="lensHandle"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
              >
                Desired Handle (e.g., yourname)
              </label>
              <input
                type="text"
                id="lensHandle"
                name="lensHandle"
                placeholder="yourcoolhandle"
                value={usernameSignUp}
                onChange={(e) => setUsernameSignUp(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                pattern="[a-z0-9-_]{5,31}"
                title="5-31 chars, lowercase letters, numbers, hyphens, underscores."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Choose a unique handle for your new profile (5-31 chars, a-z, 0-9, -, _).
              </p>
            </div>
          </form>
          {/* Feedback */}
          {feedback && !(feedback.startsWith('ℹ️') || feedback.startsWith('Processing') || feedback.startsWith('Checking')) && (
            <p
              className={`text-sm p-2 rounded-md ${
                feedback.startsWith('✅')
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {feedback}
            </p>
          )}
          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={async () => {
                const profile = await handleLoginOrCreateWithLens(
                  state.stateSessionClient,
                  usernameSignUp
                );
                actions.setStateActiveLensProfile(profile);
              }}
              disabled={isLoadingAction || !isConnected}
              className="w-full inline-flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:text-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoadingAction ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing with Lens...
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            This will use your connected wallet to sign into Lens. If you don't have a profile linked yet, this may initiate profile creation.
          </p>
        </div>
      </div>
    </>
  ) : null;
}
