// src/components/SimplePostCreator.tsx
'use client'; // Keep if planning client-side interactions later

import { useState } from 'react';

// Constants (can be moved to a config file later)
const APP_ID = 'test-lens1'; // Or your Kintask App ID

export default function SimplePostCreator() {
  const [content, setContent] = useState('');
  const [uiFeedback, setUiFeedback] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false); // Local loading state

  // --- Simulated State (to be replaced by actual Lens/wallet state) ---
  const SIMULATED_IS_LOGGED_IN_WITH_PROFILE = false; // CHANGE TO true TO SIMULATE LOGGED IN
  const SIMULATED_PROFILE_HANDLE = "yourprofile.test"; // Example handle
  const SIMULATED_PROFILE_ID = "0x01"; // Example profile ID
  // --- End Simulated State ---

  const isLoggedInWithProfile = SIMULATED_IS_LOGGED_IN_WITH_PROFILE; // Use simulated value
  const activeProfileInfo = isLoggedInWithProfile
    ? { handle: SIMULATED_PROFILE_HANDLE, id: SIMULATED_PROFILE_ID }
    : null;


  const handlePost = async () => {
    setUiFeedback(null); // Clear previous feedback
    console.log('[SimplePostCreator] handlePost triggered.');

    if (!isLoggedInWithProfile || !activeProfileInfo) {
      const msg = '⚠️ Please log in with an active Lens Profile first.';
      setUiFeedback(msg);
      alert("Login/Connect Wallet functionality will be implemented in the Navbar."); // Placeholder
      console.warn(`[SimplePostCreator] ${msg} (Simulated)`);
      return;
    }

    if (!content.trim()) {
      const msg = '⚠️ Post content cannot be empty.';
      setUiFeedback(msg);
      console.warn(`[SimplePostCreator] ${msg}`);
      return;
    }

    setUiFeedback('Preparing post...');
    setIsPosting(true); // Set local loading state
    console.log('[SimplePostCreator] Active Profile ID for post (Simulated):', activeProfileInfo.id);
    console.log('[SimplePostCreator] Content for post:', content);

    // --- SIMULATED POST CREATION ---
    // Replace this with actual Lens SDK V2 logic:
    // 1. Create metadata object (text-only, article, image, etc.)
    // 2. Upload metadata JSON to IPFS/Arweave to get a metadataURI
    // 3. Call Lens Client SDK V2 `createPost` (or similar action) with the metadataURI

    console.log('[SimplePostCreator] Simulating metadata creation & upload...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate metadata prep
    const simulatedMetadataURI = `ipfs://SIMULATED_METADATA_HASH_FOR_${Date.now()}`;
    setUiFeedback(`Metadata prepared (Simulated URI: ${simulatedMetadataURI.substring(0, 20)}...)`);

    console.log('[SimplePostCreator] Simulating post submission to Lens Protocol...');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay for post creation

    const simulatedSuccess = true; // Change to false to test error path
    const simulatedTxOrPubId = simulatedSuccess ? `0xSIMULATED_TX_OR_PUB_ID_${Date.now()}` : null;

    if (simulatedSuccess && simulatedTxOrPubId) {
      const finalMsg = `✅ Post submitted! (Simulated - ID/Tx: ${simulatedTxOrPubId.substring(0, 12)}...). Refresh feed to see.`;
      setUiFeedback(finalMsg);
      console.log(`[SimplePostCreator] ${finalMsg}`);
      setContent(''); // Clear input on success
    } else {
      const simulatedErrorMessage = "Simulated error: Failed to create post.";
      setUiFeedback(`❌ Error creating post: ${simulatedErrorMessage}`);
      console.error('[SimplePostCreator] Simulated post creation failed.');
    }
    // --- END SIMULATED POST CREATION ---

    setIsPosting(false); // Reset local loading state
  };


  // --- UI Rendering ---
  return (
    <div className="border p-4 sm:p-6 rounded-lg shadow-md bg-white dark:bg-slate-800 my-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Create a New Lens Post</h2>

      {!isLoggedInWithProfile ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-md text-center">
            <p className="text-sm text-amber-700 dark:text-amber-200">
            Please connect your wallet and sign in with Lens (via Navbar) to create a post.
            </p>
             <button
                onClick={() => alert("Connect Wallet/Login functionality will be in the Navbar.")}
                className="mt-2 px-4 py-1.5 bg-kintask-blue text-white text-xs font-medium rounded-md hover:bg-kintask-blue-dark transition-colors"
            >
                Connect/Login (Placeholder)
            </button>
        </div>
      ) : (
        <>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kintask-blue focus:border-kintask-blue transition-colors placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
            rows={4}
            placeholder={activeProfileInfo?.handle ? `What's on your mind, @${activeProfileInfo.handle.split('.')[0]}?` : `What's on your mind?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
            aria-label="Post content"
          />

          {uiFeedback && (
            <p className={`mt-2 text-sm p-2 rounded-md ${
                uiFeedback.startsWith('❌') || uiFeedback.startsWith('⚠️')
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
              {uiFeedback}
            </p>
          )}

          <button
            onClick={handlePost}
            disabled={isPosting || !content.trim() || !isLoggedInWithProfile}
            className="mt-4 px-6 py-2 bg-kintask-blue hover:bg-kintask-blue-dark text-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kintask-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-opacity"
          >
            {isPosting ? (
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
            Posts are published on the Lens Protocol Testnet.
          </p>
        </>
      )}
    </div>
  );
}