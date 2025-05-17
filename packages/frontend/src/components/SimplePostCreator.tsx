// src/components/SimplePostCreator.tsx
'use client';

import { useState } from 'react';
// import { textOnly } from "@lens-protocol/metadata"; // Not directly used here, but could be in handlePost
// import { storageClient } from "../lib/storage-client"; // Likely used within useSessionClient or handlePost
// import { post,fetchAccount,fetchAccountsAvailable,createAccountWithUsername } from "@lens-protocol/client/actions"; // Likely used within useSessionClient or handlePost
// import { uri } from "@lens-protocol/client"; // Likely used within useSessionClient or handlePost
import { useAccount } from 'wagmi';

// --- IMPORT YOUR AUTH CONTEXT HOOK ---
import { useAppContext } from '../context/useAppState';

// Your custom hook for actions is still very useful
import useSessionClient from "../lib/useSessionClient";


// Constants (can be moved to a config file later)
// const APP_ID = 'test-lens1'; // Or your Kintask App ID - If needed by handlePost, it's likely in useSessionClient

export default function SimplePostCreator() {
  const [content, setContent] = useState('');
  const { address, isConnected, isConnecting } = useAccount(); // isConnecting not used in original render but good to have

  // --- GET AUTH STATE FROM CONTEXT ---
  const {
    state     // To know if the session (and profile) is still being loaded
  } = useAppContext();

  // --- KEEP useSessionClient FOR ACTIONS AND LOCAL UI STATE FOR ACTIONS ---
  const {
    // sessionClient, // Not directly used in this component's render logic
    feedback,      // Feedback specific to the posting action
    isPosting,     // Loading state specific to the posting action
    handlePost,    // The function that performs the post
    // isCheckingLensSession, // Replaced by isLoadingSession from context
    // isLoading, // This was likely for the overall session; isPosting is for the action
  } = useSessionClient();


  // Determine the placeholder text based on the active profile from context
  // Your original structure for activeLensProfile was:
  // activeLensProfile: { username?: { localName: string }, address?: string }
  // Adjust placeholder to match this.
  const placeholderHandle = state.stateActiveLensProfile?.username?.localName || state.stateActiveLensProfile?.address?.substring(0, 6) || "Lens User";
  const placeholderText = `What's on your mind, @${placeholderHandle}?`;

  // --- UI Rendering ---
  return (
    <div className="border p-4 sm:p-6 rounded-lg shadow-md bg-white dark:bg-slate-800 my-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Create a New Lens Post</h2>

      {/* Show loading state if session is still being checked by AuthContext */}
      {state.isLoadingSession && !isConnecting && (
        <div className="p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-center animate-pulse">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            checking Lens status...Check pending signatures
          </p>
        </div>
      )}

      {/* Show connect message if wallet not connected, or if session is loaded but no profile */}
      {(!isConnected || (!state.isLoadingSession && !state.stateActiveLensProfile)) && !isConnecting && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-md text-center">
          <p className="text-sm text-amber-700 dark:text-amber-200">
            Please connect your wallet and ensure you have an active Lens profile to create a post.
          </p>
          {/* You might want to link to your ProfileCreator or a login component here */}
          {/* Original placeholder button:
             <button
                onClick={() => alert("Connect Wallet/Login functionality will be in the Navbar.")}
                className="mt-2 px-4 py-1.5 bg-kintask-blue text-white text-xs font-medium rounded-md hover:bg-kintask-blue-dark transition-colors"
            >
                Connect/Login (Placeholder)
            </button> */}
        </div>
      )}

      {/* Show post creation form if connected AND session loaded AND there's an active profile */}
      {isConnected && !state.isLoadingSession && state.stateActiveLensProfile && (
        <>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kintask-blue focus:border-kintask-blue transition-colors placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
            rows={4}
            placeholder={placeholderText}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting} // Disable if the post action is in progress
            aria-label="Post content"
          />

          {feedback && ( // Feedback from the handlePost action
            <p className={`mt-2 text-sm p-2 rounded-md ${feedback.startsWith('❌') || feedback.startsWith('⚠️')
                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
              {feedback}
            </p>
          )}

          <button
            onClick={async () => {
              if (state.stateActiveLensProfile) { // Ensure profile is still there before posting
                // The handlePost function from useSessionClient likely uses the
                // active profile and sessionClient it has internally.
                await handlePost(content, state.stateSessionClient, state.stateActiveLensProfile); // Call the action from useSessionClient
                setContent(''); // Clear input on presumed success (handlePost should manage feedback)
              } else {
                // This case should ideally be prevented by the UI rendering conditions
                alert("Error: No active Lens profile to post with.");
              }
            }}
            // Disable if posting action is in progress, no content, or (redundantly) not connected/no profile
            disabled={isPosting || !content.trim() || !isConnected || !state.stateActiveLensProfile}
            className="mt-4 px-6 py-2 bg-kintask-blue hover:bg-kintask-blue-dark text-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kintask-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-opacity"
          >
            {isPosting ? ( // isPosting from useSessionClient (action-specific loading)
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : 'Create Post'}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Posts are published on the Lens Protocol.
          </p>
        </>
      )}
    </div>
  );
}