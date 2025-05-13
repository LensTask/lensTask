// components/SimplePostCreator.tsx
import { useState } from 'react';
import { useSession, useCreatePost, SessionType } from '@lens-protocol/react-web';
import { createPostMetadata, MetadataV3 } from '@lens-protocol/metadata'; 
import { StorageClient, immutable } from '@lens-chain/storage-client';

const LENS_CHAIN_ID_FOR_ACL = process.env.NODE_ENV === 'development' ? 37111 : 232;
const APP_ID = 'test-lens-1';

export default function SimplePostCreator() {
  const [content, setContent] = useState('');
  const [uiFeedback, setUiFeedback] = useState<string | null>(null);

  const { data: session, loading: sessionLoading } = useSession();
  const { execute: createPost, loading: isPosting, error: postError } = useCreatePost();

  // More detailed check for logged-in status
  const isAuthenticated = session?.authenticated === true;
  const hasProfile = !!session?.profile;
  const sessionTypeIsWithProfile = session?.type === SessionType.WithProfile;
  const isLoggedInWithProfile = isAuthenticated && hasProfile && sessionTypeIsWithProfile;

  console.log(
    '[SimplePostCreator] Render. Session Loading:', sessionLoading, 
    '| Is Authenticated (session.authenticated):', isAuthenticated,
    '| Has Profile (session.profile exists):', hasProfile,
    '| Session Type is WITH_PROFILE:', sessionTypeIsWithProfile,
    '| Final isLoggedInWithProfile:', isLoggedInWithProfile,
    '| Is Posting Hook Loading:', isPosting
  );
  if (session) {
    console.log('[SimplePostCreator] Full Session Data:', JSON.parse(JSON.stringify(session)));
    console.log('[SimplePostCreator] Session Type from data:', session.type);
  }
  if (postError) console.error('[SimplePostCreator] Post Hook Error on Render:', postError);


  const handlePost = async () => {
    setUiFeedback(null);
    console.log('[SimplePostCreator] handlePost triggered.');

    if (!isLoggedInWithProfile || !session?.profile) { // Check session.profile explicitly too
      const msg = '⚠️ Please log in with an active Lens Profile first (see Navbar). Current session may not have an active profile.';
      setUiFeedback(msg);
      console.warn(`[SimplePostCreator] ${msg} Session details: ${JSON.stringify(session)}`);
      return;
    }
    // ... (rest of handlePost remains the same)
    if (!content.trim()) {
      const msg = '⚠️ Post content cannot be empty.';
      setUiFeedback(msg);
      console.warn(`[SimplePostCreator] ${msg}`);
      return;
    }

    setUiFeedback('Preparing post...');
    console.log('[SimplePostCreator] Active Profile ID for post:', session.profile.id);
    console.log('[SimplePostCreator] Content for post:', content);

    try {
      const metadata: MetadataV3 = createPostMetadata({
        appId: APP_ID,
        content: content,
        locale: 'en',
      });
      console.log('[SimplePostCreator] Generated metadata object:', metadata);

      const storage = StorageClient.create();
      setUiFeedback('Uploading metadata to Grove via @lens-chain/storage-client...');
      console.log('[SimplePostCreator] Initiating metadata upload...');
      
      const { uri, anError } = await storage.uploadJson(metadata, {
        acl: immutable(LENS_CHAIN_ID_FOR_ACL),
      });

      if (anError) {
        console.error('[SimplePostCreator] Error uploading JSON to Grove:', anError);
        setUiFeedback(`❌ Error uploading metadata: ${anError.message}`);
        return;
      }
      
      console.log('[SimplePostCreator] Metadata successfully uploaded. URI:', uri);
      setUiFeedback(`Metadata URI: ${uri}`);

      setUiFeedback('Submitting post to Lens Protocol...');
      console.log('[SimplePostCreator] Calling createPost hook with metadata URI:', uri);
      
      const result = await createPost({
        metadata: uri,
      });

      console.log('[SimplePostCreator] createPost hook result:', JSON.parse(JSON.stringify(result)));

      if (result.isSuccess()) {
        const successValue = result.value;
        let txInfo = '';
        if (typeof successValue === 'object' && successValue !== null) {
            if ('txHash' in successValue && successValue.txHash) {
                 txInfo = `On-chain Tx Hash: ${successValue.txHash}`;
            } else if ('id' in successValue && successValue.id) {
                 txInfo = `Publication ID (Momoka): ${successValue.id}`;
            } else if ('reason' in successValue && typeof successValue.reason === 'string') {
                 txInfo = `Optimistic Failure Reason: ${successValue.reason}`;
            } else {
                 txInfo = "Submission processed.";
            }
        } else {
            txInfo = "Submission status unclear.";
        }
        
        const finalMsg = `✅ Post submitted! ${txInfo}`;
        setUiFeedback(finalMsg);
        console.log(`[SimplePostCreator] ${finalMsg}`);
        setContent('');
      } else {
        const errorMsg = result.error.message || "Unknown error during post creation.";
        setUiFeedback(`❌ Error creating post: ${errorMsg}`);
        console.error('[SimplePostCreator] Failed to create post. SDK Error:', result.error);
      }
    } catch (e: any) {
      const errorMsg = e.message || "An unexpected error occurred during the posting process.";
      setUiFeedback(`❌ Unexpected error: ${errorMsg}`);
      console.error('[SimplePostCreator] Exception in handlePost:', e);
    }
  };

  if (sessionLoading) {
    return <div className="border p-4 rounded text-center"><p>Loading session...</p></div>;
  }

  // UI Rendering
  return (
    <div className="border p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 my-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Create a New Post (on Lens Testnet)</h2>
      
      {!isLoggedInWithProfile ? (
        <p className="text-amber-600 dark:text-amber-400">
          Please connect your wallet (MetaMask) and log in with your Lens Profile using the buttons in the navigation bar to create a post.
          <br />
          <span className="text-xs italic">(Debug: Authenticated: {String(isAuthenticated)}, Has Profile in Session: {String(hasProfile)}, Session Type: {session?.type || 'N/A'})</span>
        </p>
      ) : (
        <>
          <textarea
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            rows={4}
            placeholder={session.profile?.handle?.fullHandle ? `What's on your mind, @${session.profile.handle.localName}?` : `What's on your mind, ${session.profile?.id}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPosting}
          />
          
          {uiFeedback && (
            <p className={`mt-2 text-sm ${(postError && !uiFeedback.startsWith('✅')) || uiFeedback.startsWith('❌') || uiFeedback.startsWith('⚠️') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {uiFeedback}
            </p>
          )}
          {postError && !uiFeedback?.startsWith('❌') && ( 
            <p className="mt-2 text-sm text-red-500 dark:text-red-400">
              Hook Error: {postError.message}
            </p>
          )}

          <button
            onClick={handlePost}
            disabled={isPosting || !content.trim() || !isLoggedInWithProfile}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-opacity"
          >
            {isPosting ? 'Posting...' : 'Create Post'}
          </button>
        </>
      )}
    </div>
  );
}
