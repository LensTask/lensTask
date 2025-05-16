// src/components/ProfileCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// *** IMPORT YOUR AUTH CONTEXT HOOK ***
import { useAuth } from '../context/appState';

// Your custom hook for actions
import useSessionClient from "../lib/useSessionClient";

export default function ProfileCreator() {
  const { address, isConnected, isConnecting } = useAccount();
  const { stateActiveLensProfile, stateSessionClient, isLoadingSession } = useAuth();
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
    if (!stateActiveLensProfile && isConnected && !isLoadingSession) {
      setShowSignUpForm(true);
    } else {
      setShowSignUpForm(false);
    }
  }, [stateActiveLensProfile, isConnected, isLoadingSession]);

  // Combined UI sections
  const loadingUI = (
    <div className="my-4 p-4 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-center animate-pulse">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {isConnecting ? 'Connecting to wallet...' : 'Checking Lens status...'}
      </p>
    </div>
  );

  const connectUI = (
    <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg text-center">
      <p className="text-sm text-amber-700 dark:text-amber-200 mb-3">
        Please connect your wallet to interact with Lens Protocol.
      </p>
      <ConnectKitButton />
    </div>
  );

  const welcomeUI = (
    <div className="my-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-600 rounded-lg text-center">
      <p className="text-sm text-green-700 dark:text-green-200">
        Welcome! Interacting as: <br />
        <strong className="font-medium">@{stateActiveLensProfile?.username?.localName ?? stateActiveLensProfile?.handle ?? address?.substring(0,6)}</strong>
      </p>
    </div>
  );

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
      )}
      <button
        onClick={() => handleLoginOrCreateWithLens(stateSessionClient, usernameSignUp)}
        disabled={isLoadingAction || !isConnected}
        className="inline-flex w-full justify-center px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-50"
      >
        {isLoadingAction
          ? 'Processing with Lens…'
          : stateActiveLensProfile
          ? 'Login Profile'
          : 'Create Profile'}
      </button>
    </div>
  );

  const debugUI = (
    <div className="mt-8 p-4 border-t dark:border-slate-700">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Debug: Assign Bounty
      </h4>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Feed address"
          value={testFeed}
          onChange={e => setTestFeed(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
        />
        <input
          type="number"
          placeholder="Post ID"
          value={testPostId}
          onChange={e => setTestPostId(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
        />
        <input
          type="text"
          placeholder="Winner address"
          value={testWinner}
          onChange={e => setTestWinner(e.target.value)}
          className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-700"
        />
        <button
          onClick={() => handleAssignResponseWinner(testFeed, Number(testPostId), testWinner)}
          disabled={!testFeed || !testPostId || !testWinner}
          className="w-full inline-flex justify-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Assign Bounty (Debug)
        </button>
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
