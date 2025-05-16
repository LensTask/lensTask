// src/components/ProfileCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// *** IMPORT YOUR AUTH CONTEXT HOOK ***
import { useAppContext } from '../context/useAppState';

// Your custom hook for actions
import useSessionClient from "../lib/useSessionClient";

export default function ProfileCreator() {
  const { address, isConnected, isConnecting } = useAccount();

  // LOG: Account hook state
  console.log('[ProfileCreator] useAccount:', { address, isConnected, isConnecting });

  // *** GET AUTH STATE FROM CONTEXT ***
  const {
    stateActiveLensProfile,
    stateSessionClient,
    isLoadingSession
  } = useAuth();

  // LOG: Auth context values
  console.log('[ProfileCreator] useAuth context:', { stateActiveLensProfile, stateSessionClient, isLoadingSession });
  const [usernameSignUp, setUsernameSignUp] = useState<string>("");

  // *** KEEP useSessionClient FOR ACTIONS AND LOCAL UI STATE ***
  const {
    feedback,
    isLoading: isLoadingAction,
    handleLoginOrCreateWithLens,
    handleAssignResponseWinner,
  } = useSessionClient();

  const [usernameSignUp, setUsernameSignUp] = useState('');
  const [testFeed, setTestFeed] = useState('');
  const [testPostId, setTestPostId] = useState('');
  const [testWinner, setTestWinner] = useState('');

  // Control showing the signup form
  const [showSignUpForm, setShowSignUpForm] = useState(false);

  useEffect(() => {
    console.log('[ProfileCreator] useEffect: Checking showSignUpForm logic', {
      stateActiveLensProfile,
      isConnected,
      isLoadingSession
    });
    if (!stateActiveLensProfile && isConnected && !isLoadingSession) {
      setSignUpFormActive(true);
      console.log('[ProfileCreator] setSignUpFormActive(true)');
    } else if (stateActiveLensProfile) {
      setSignUpFormActive(false);
      console.log('[ProfileCreator] setSignUpFormActive(false)');
    }
  }, [state.stateActiveLensProfile, isConnected, state.isLoadingSession]);

  // LOG: Rendering loading state
  if (isConnecting || isLoadingSession) {
    console.log('[ProfileCreator] Loading UI - isConnecting or isLoadingSession:', { isConnecting, isLoadingSession });
    return (
      <div className="my-4 p-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center animate-pulse">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isConnecting ? "Connecting to wallet..." : "Checking Lens status..."}
        </p>
      </div>
    );
  }

  // LOG: Wallet NOT connected
  if (!isConnected) {
    console.log('[ProfileCreator] Wallet not connected!');
    return (
      <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-200 mb-3">
          Please connect your wallet to interact with Lens Protocol.
        </p>
        <ConnectKitButton />
      </div>
    );
  }

  // LOG: Active Lens Profile detected
  if (stateActiveLensProfile) {
    const displayHandle = stateActiveLensProfile.username?.localName;
    console.log('[ProfileCreator] Active Lens profile detected:', stateActiveLensProfile);

    return (
      <div className="my-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg text-center">
        <p className="text-sm text-green-700 dark:text-green-200">
          Welcome! Interacting as: <br />
          <strong className="font-medium">@{displayHandle}</strong>
        </p>
      </div>
    );
  }

  const loginCreateUI = (
    <div className="my-6 p-4 sm:p-6 border rounded-lg shadow-md bg-white dark:bg-slate-800">
      <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Login or Create Profile with Lens</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Wallet: <code className="text-xs bg-slate-100 dark:bg-slate-700 p-0.5 rounded">
          {address?.substring(0,6)}...{address?.substring(address.length-4)}
        </code>
        <br />
        {feedback || 'Click below to sign in with Lens or create a new profile.'}
      </p>
      {showSignUpForm && (
        <form className="space-y-4 border-b dark:border-slate-700 pb-6 mb-6" onSubmit={e => e.preventDefault()}>
          <h4 className="text-lg font-medium text-gray-800 dark:text-slate-200">Create a New Lens Profile</h4>
          <input
            type="text"
            placeholder="Desired handle"
            value={usernameSignUp}
            onChange={e => setUsernameSignUp(e.target.value)}
            className="block w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
          />
        </form>
      }
      <div className="space-y-4">
        {feedback && !(feedback.startsWith("ℹ️") || feedback.startsWith("Processing") || feedback.startsWith("Checking")) && (
          <p className={`text-sm p-2 rounded-md ${feedback.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
            {feedback}
          </p>
        )}
        <div>
          <button
            onClick={(e) => {
              console.log('[ProfileCreator] Login/Create button clicked');
              handleLoginOrCreateWithLens(stateSessionClient,usernameSignUp);
            }}
            type="button"
            disabled={isLoadingAction || !isConnected}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:text-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoadingAction ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing with Lens...
              </>
            ) :
              !stateActiveLensProfile ?
                "Create Profile" :
                'Login Profile'
            }
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        This debug panel lets you test your `execute` call directly from the front-end.
      </p>
    </div>
  );

  return (
    <>
      {isConnecting || isLoadingSession ? loadingUI : null}
      {!isConnecting && !isLoadingSession && !isConnected ? connectUI : null}
      {!isConnecting && !isLoadingSession && isConnected && stateActiveLensProfile ? welcomeUI : null}
      {!isConnecting && !isLoadingSession && isConnected && !stateActiveLensProfile ? loginCreateUI : null}
      {isConnected ? debugUI : null}
    </>
  );
}
