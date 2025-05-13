// components/SimplePostCreator.tsx
import { useState } from 'react';
import { useSession, useCreatePost, Profile } from '@lens-protocol/react-web';
import { textOnly, appId as formatAppId } from '@lens-protocol/metadata'; // textOnly creates TextOnlyMetadataV3
import { upload } from '@lens-protocol/client'; // Standard IPFS uploader

// Define your Lens App ID. This is important for filtering and identifying posts made by your app.
// Replace with your actual App ID if you have one registered, otherwise, this is a free-form string.
const LENS_APP_ID = 'lin-intel-v3-test'; // Or your specific App ID for this project

export default function SimplePostCreator() {
  const [content, setContent] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // 1. Get the logged-in user's session and profile
  // useSession provides information about the current user session, including the authenticated profile.
  const { data: session } = useSession();
  const activeProfile: Profile | null | undefined = session?.profile;

  // 2. Setup the useCreatePost hook
  // This hook handles the complexities of creating a post, including dispatcher integration or typed data signing.
  // If 'activeProfile' has a dispatcher, the post can be gasless (sponsored). Otherwise, the user will be prompted to sign.
  const { execute: createPost, error: createPostError, isPending: isCreatingPost } = useCreatePost();
  // Note: Some hooks might take 'publisher: activeProfile' in their options, e.g., useCreatePost({ publisher: activeProfile }).
  // However, @lens-protocol/react-web hooks generally infer the active profile from the session.

  const handlePost = async () => {
    if (!activeProfile) {
      setFeedback('⚠️ Please log in with your Lens profile first.');
      return;
    }
    if (!content.trim()) {
      setFeedback('⚠️ Post content cannot be empty.');
      return;
    }

    setFeedback('Processing post...');
    try {
      // 3. Create Publication Metadata
      // For a simple text post, 'textOnly' from '@lens-protocol/metadata' is used.
      // It correctly formats metadata for Lens V3 (specifically TextOnlyMetadataV3).
      // 'appId' helps in identifying and filtering content created by your application.
      const metadata = textOnly({
        content,
        appId: formatAppId(LENS_APP_ID), // Ensure AppId is correctly formatted if using complex AppId
      });

      // 4. Upload Metadata to IPFS
      // The metadata JSON object must be uploaded to IPFS (or another decentralized storage).
      // 'uploadToIpfs' returns a URI (e.g., ipfs://<hash>)
      setFeedback('Uploading metadata to IPFS...');
      const metadataUri = await upload(metadata);
      console.log('[SimplePostCreator] Metadata uploaded to IPFS:', metadataUri);

      // 5. Execute the post creation
      // The 'createPost' function (from useCreatePost) takes the metadata URI.
      // It will attempt to use the profile's dispatcher if enabled, otherwise, it prompts the user to sign the transaction.
      setFeedback('Submitting post to Lens Protocol...');
      const result = await createPost({
        metadata: metadataUri,
        // By default, this creates an on-chain post.
        // For Momoka (off-chain data availability layer), additional parameters might be needed,
        // e.g. { sponsored: true } if the hook supports it directly for Momoka via dispatcher,
        // or specific momoka flags if available in CreatePostArgs.
        // The exact way to specify Momoka vs. OnChain depends on the hook's capabilities and defaults.
        // For this simple creator, we assume default (on-chain) behavior.
      });

      // 6. Handle the result
      if (result.isSuccess()) {
        const successValue = result.value;
        // 'successValue' contains information about the transaction, e.g.,
        // for on-chain: { txHash: '0x...' }
        // for Momoka: { momokaId: '0x...', proof: '0x...' }
        // for dispatcher relay: { relaySuccess: { txHash: '0x...', txId: '...' } }
        console.log('[SimplePostCreator] Post creation successful:', successValue);
        setFeedback(`✅ Post submitted successfully! Confirmation: ${JSON.stringify(successValue)}`);
        setContent(''); // Clear content field on success
      } else {
        // 'result.error' is an instance of LensSdkError
        console.error('[SimplePostCreator] Post creation failed:', result.error);
        setFeedback(`❌ Error creating post: ${result.error.name} - ${result.error.message}`);
      }
    } catch (e: any) {
      // Catch any other unexpected errors during the process
      console.error('[SimplePostCreator] An unexpected error occurred:', e);
      setFeedback(`❌ An unexpected error occurred: ${e.message || 'Unknown error'}`);
    }
  };

  // Display login prompt if no active profile
  if (!activeProfile) {
    return (
      <div className="border p-4 rounded bg-gray-50 dark:bg-gray-700 my-4">
        <p className="text-gray-700 dark:text-gray-200">
          Please <button onClick={() => { /* TODO: Trigger login flow using useLogin hook */ }} className="text-blue-500 hover:underline font-semibold">log in</button> to create a post.
        </p>
        {/*
          For login, you would typically use the 'useLogin' hook from '@lens-protocol/react-web'.
          Example:
          const { execute: login, error: loginError, isPending: isLoginPending } = useLogin();
          const handleLogin = async (address: string, profileId?: string) => { // address and optional profileId
            const result = await login({ address, profileId }); // profileId is optional for subsequent logins
            if (result.isFailure()) {
              console.error('[Login Error]', result.error.message);
              // Handle login error (e.g., show to user)
            } else {
              // Login successful, session is updated automatically
              console.log('[Login Success]', result.value);
            }
          };
          // You'd call handleLogin typically after wallet connection and profile selection.
        */}
      </div>
    );
  }

  return (
    <div className="border p-4 rounded shadow-md bg-white dark:bg-gray-800 my-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Create a New Post</h2>
      <textarea
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
        rows={4}
        placeholder={`What's on your mind, @${activeProfile.handle?.fullHandle || activeProfile.id}?`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isCreatingPost}
        aria-label="Post content"
      />

      {/* Feedback Messages */}
      {feedback && (
        <p className={`my-2 p-2 rounded-md text-sm ${feedback.startsWith('❌') ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200' : (feedback.startsWith('✅') ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200')}`}>
          {feedback}
        </p>
      )}
      {/* Display specific error from the hook if feedback is not already showing it */}
      {createPostError && !feedback?.includes(createPostError.message) && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-2">
          Hook Error: {createPostError.name} - {createPostError.message}
        </p>
      )}

      <button
        onClick={handlePost}
        disabled={isCreatingPost || !content.trim() || !activeProfile}
        className="mt-3 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
      >
        {isCreatingPost ? 'Posting...' : 'Post to Lens'}
      </button>
    </div>
  );
}
