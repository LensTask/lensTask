// src/pages/profile/[handle].tsx
// OR pages/profile/[handle].tsx

import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // For Next.js navigation
// --- LENS V3 REACT SDK IMPORTS ---
// Ensure these imports match your installed V3 SDK package exactly
import {
  profileId,
  useProfile,
  usePublications,
  Post,           // V3 type for a Post
  PublicationType,       // Example enum for types
  LimitType,           // V3 type for limits, or use numbers
} from '@lens-protocol/react-web'; // SPECULATIVE: Replace with actual package name
// --- END LENS V3 IMPORTS ---
import { PostFragment } from '@lens-protocol/client';

import ProfileView from '../../../components/ProfileView';       // Adjust path
import PublicationCard from '../../../components/PublicationCard';   // Adjust path
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'; // For nice error/info messages

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { query } = router;

  // 1. Get the raw handle from the URL query
  const rawHandleFromQuery = Array.isArray(query.handle) ? query.handle[0] : query.handle;

  // 2. Prepare the handle for the `useProfile` hook
  // The hook likely expects the full namespaced handle, e.g., "lens/stani" or "test/stani"
  // The URL might provide "stani.lens" or "stani.test"
  let apiFormattedProfileHandle: string | undefined = undefined;
  if (rawHandleFromQuery) {
    const parts = rawHandleFromQuery.split('.');
    if (parts.length === 2) { // e.g., "stani.lens" or "dave.test"
      apiFormattedProfileHandle = `${parts[1]}/${parts[0]}`; // -> "lens/stani" or "test/dave"
    } else if (parts.length === 1) {
      // If only "stani" is in URL, assume default namespace (e.g., "lens")
      // This might be too assumptive; better if URL always has full "name.namespace"
      console.warn(`[ProfilePage] Handle "${rawHandleFromQuery}" from URL is only localname. Assuming default namespace 'lens'.`);
      apiFormattedProfileHandle = `lens/${rawHandleFromQuery}`; // e.g. "lens/stani"
    } else {
      console.error(`[ProfilePage] Invalid handle format from URL: "${rawHandleFromQuery}"`);
      // apiFormattedProfileHandle remains undefined, hook won't run or will error
    }
  }
  // --- Fetch the Specific Profile using Lens V3 `useProfile` Hook ---
  const {
    data: profileData,
    loading: isLoadingProfile,
    error: profileError,
  } = useProfile({
    forHandle: apiFormattedProfileHandle, // Pass the correctly formatted handle
  });

  // --- Fetch Profile's Publications using Lens V3 `usePublications` Hook ---
  const profileIdForPublications = profileData?.id; // Get ID from successfully fetched profile

  const {
    data: publicationsPaginator, // The hook likely returns a paginator object
    loading: isLoadingPublications,
    error: publicationsError,
    hasMore: hasMorePublications,
    next: fetchNextPublications,
  } = usePublications({
    limit: LimitType.Ten, 
    where: {
      publicationTypes: [PublicationType.Post],
      from: [profileId(profileIdForPublications)], 
    }
  });
  console.log(publicationsPaginator)
  // Extract actual publication items from the paginator
  const postsToDisplay: Post[] = (publicationsPaginator || []) as Post[];


  // --- Render Logic ---
  if (isLoadingProfile && !profileData) {
    return <div className="flex justify-center items-center min-h-screen"><p className="p-4 text-gray-500 dark:text-gray-400 animate-pulse">Loading profile for "{rawHandleFromQuery || 'profile'}"...</p></div>;
  }

  if (profileError && !profileData) {
    return (
      <main className="max-w-3xl mx-auto p-4 text-center">
         <Link href="/" legacyBehavior>
            <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
             ← Back to Explore
            </a>
         </Link>
        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-6 rounded-md shadow-lg mt-10" role="alert">
          <div className="flex">
            <div className="py-1"><ExclamationTriangleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mr-4" /></div>
            <div>
              <p className="font-bold text-lg">Error Loading Profile</p>
              <p className="text-sm mt-1">
                Could not load profile for "{rawHandleFromQuery}".<br />
                Details: {profileError.message}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profileData) { // Hook finished, no error, but no profile data (e.g., profile not found)
    return (
        <main className="max-w-3xl mx-auto p-4 text-center">
           <Link href="/explore" legacyBehavior>
             <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
                ← Back to Explore
             </a>
           </Link>
           <div className="bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-6 rounded-md shadow-lg mt-10" role="alert">
             <div className="flex">
               <div className="py-1"><InformationCircleIcon className="h-8 w-8 text-sky-500 dark:text-sky-400 mr-4" /></div>
               <div>
                 <p className="font-bold text-lg">Profile Not Found</p>
                 <p className="text-sm mt-1">The profile "@{rawHandleFromQuery}" could not be found on Lens Protocol.</p>
               </div>
             </div>
           </div>
        </main>
    );
  }

  // --- Profile Display ---
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
          <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
            ← Back to Explore
          </a>
      </Link>

      <ProfileView profile={profileData} /> {/* Pass the fetched profile data */}

      <div className="mt-12">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          Recent Posts
        </h2>
        {isLoadingPublications && !postsToDisplay.length && (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading posts...</p>
            </div>
        )}
        {publicationsError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-md shadow-sm" role="alert">
            <p className="font-medium text-sm">Error loading posts:</p>
            <p className="text-xs">{publicationsError.message}</p>
          </div>
        )}
        {!isLoadingPublications && !publicationsError && postsToDisplay.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg">This profile hasn't made any posts yet.</p>
          </div>
        )}

        {postsToDisplay.length > 0 && (
          <div className="space-y-6">
            {postsToDisplay.map((pub) => (
              <PublicationCard key={pub.id} publication={pub as PostFragment} />
            ))}
          </div>
        )}

        {/* Load More Button for Publications */}
        {hasMorePublications && fetchNextPublications && (
            <div className="text-center mt-8">
                <button
                    onClick={async () => {
                        try { await fetchNextPublications(); }
                        catch (e: any) { console.error("Failed to fetch next page of publications:", e.message); }
                    }}
                    disabled={isLoadingPublications}
                    className="px-6 py-2 bg-kintask-blue text-white font-semibold rounded-lg hover:bg-kintask-blue-dark focus:outline-none focus:ring-2 focus:ring-kintask-blue focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoadingPublications ? 'Loading More...' : 'Load More Posts'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;