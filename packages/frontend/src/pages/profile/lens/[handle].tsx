// src/pages/profile/[handle].tsx
// OR pages/profile/[handle].tsx if you don't have an src directory

import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import { ProfileFragment, PostFragment, PublicationFragment, LimitType } from '@lens-protocol/client';
import { lensClient } from '../../../lib/lensClient';     // Adjust path
import ProfileView from '../../../components/ProfileView'; // Adjust path
import PublicationCard from '../../../components/PublicationCard'; // Adjust path

// Define a mock profile if needed for fallback or initial state
const MOCK_PROFILE_HANDLE = "stani.lens"; // Or a known test handle like "stani.test"
const MOCK_PROFILE: ProfileFragment | null = null; // Set to null or a mock object

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { query } = router;

  // Get the handle from the URL query parameters
  // Ensure it's treated as a string. If it's an array, take the first element.
  const rawHandleFromQuery = Array.isArray(query.handle) ? query.handle[0] : query.handle;

  // Determine the handle to fetch: use query if present, otherwise fallback to mock (or undefined)
  const handleToFetch = rawHandleFromQuery ?? MOCK_PROFILE_HANDLE; // Fallback to a known handle for dev/mock
  const isUsingMockHandle = !rawHandleFromQuery || rawHandleFromQuery === MOCK_PROFILE_HANDLE;


  // --- Query for the Profile ---
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    isError: isProfileError, // More specific boolean for error state
  } = useQuery<ProfileFragment | null, Error>({ // Specify types for data and error
    queryKey: ['profile', handleToFetch], // Unique query key
    queryFn: async () => {
      if (!handleToFetch) {
        console.log("No handle to fetch, returning null.");
        return null;
      }

      console.log(`[React Query] Raw handle to fetch from URL/query: ${handleToFetch}`);

      // --- >>> CORRECTED HANDLE CONSTRUCTION <<< ---
      let apiFormattedHandle: string;
      const parts = handleToFetch.split('.');
      if (parts.length === 2) {
        // Assumes format like "username.namespace" e.g., "stani.lens" or "davebank.test"
        apiFormattedHandle = `${parts[1]}/${parts[0]}`; // Converts to "namespace/username" e.g., "lens/stani" or "test/davebank"
      } else {
        // If it's not in "username.namespace" format, it's likely invalid or needs different handling.
        // For now, we can assume this is an error or try a default namespace if applicable.
        // For a robust solution, you might want to validate the handle structure from the URL.
        console.warn(`[React Query] Handle "${handleToFetch}" is not in 'localname.namespace' format. Attempting default 'lens' namespace or this might fail.`);

        apiFormattedHandle = `lens/${parts[0]}`; // Converts to "namespace/username" e.g., "lens/stani" or "test/davebank"

      }
      // --- >>> END CORRECTION <<< ---

      console.log(`[React Query] Fetching profile with API formatted handle: ${apiFormattedHandle}`);

      try {
        // Use the apiFormattedHandle for the Lens Client fetch
        const profile = await lensClient.profile.fetch({ forHandle: apiFormattedHandle });

        if (!profile) {
             console.warn(`[React Query] Profile not found for API handle: ${apiFormattedHandle}`);
             throw new Error(`Profile with handle "${handleToFetch}" (API: ${apiFormattedHandle}) not found.`);
        }
        console.log(`[React Query] Successfully fetched profile for ${apiFormattedHandle}:`, profile.id);
        return profile;
      } catch (err: any) {
         console.error(`[React Query] Error fetching profile ${apiFormattedHandle}:`, err);
         throw new Error(err.message || `Failed to fetch profile ${handleToFetch}`);
      }
    },
    enabled: !!handleToFetch, // Only run query if handleToFetch is truthy
    retry: 1, // Retry once on failure
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache kept for 10 minutes
  });


  // --- Query for Publications (dependent on profileData.id) ---
  const profileIdForPublications = profileData?.id;
  const {
    data: publicationsData,
    isLoading: isLoadingPublications,
    error: publicationsError,
    isError: isPublicationsError,
  } = useQuery<{ items: PostFragment[], pageInfo: any } | null, Error>({
    queryKey: ['publications', profileIdForPublications],
    queryFn: async () => {
      if (!profileIdForPublications) {
        console.log("[React Query] No profile ID for publications, skipping fetch.");
        return null; // No profile ID, so no publications to fetch
      }
      console.log(`[React Query] Fetching publications for profile ID: ${profileIdForPublications}`);
      try {
        const result = await lensClient.publication.fetchAll({
          limit: LimitType.Ten, // Use LimitType enum
          where: {
            from: [profileIdForPublications],
            publicationTypes: ['POST'],
          },
        });
        // Ensure items are PostFragment
        const posts = result.items.filter(item => item.__typename === 'Post') as PostFragment[];
        return { items: posts, pageInfo: result.pageInfo };
      } catch (err: any) {
         console.error(`[React Query] Error fetching publications for ${profileIdForPublications}:`, err);
         throw new Error(err.message || `Failed to fetch publications for ${profileIdForPublications}`);
      }
    },
    enabled: !!profileIdForPublications, // Only run if profileId is available
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });


  // --- Render Logic ---
  if (isLoadingProfile) {
    return <div className="container mx-auto p-10 text-center">Loading profile data...</div>;
  }

  // Display error if profile fetch failed (and no fallback logic desired here)
  if (isProfileError && profileError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Error Loading Profile</h1>
        <p className="text-gray-700 dark:text-gray-300">
          Could not load profile for "{handleToFetch}". Error: {profileError.message}
        </p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            ← Go Back
        </button>
      </div>
    );
  }

  // If query succeeded but profileData is null (Lens API returned null for non-existent profile)
  if (!profileData) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-semibold">Profile Not Found</h1>
        <p className="text-gray-600">The profile for "@{handleToFetch}" could not be found.</p>
         <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            ← Go Back
        </button>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4">
      <button onClick={() => router.back()} className="mb-6 text-kintask-blue hover:underline text-sm">
        ← Back
      </button>

      <ProfileView profile={profileData} />

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Recent Posts</h2>
        {isLoadingPublications && <p className="text-center text-gray-500 dark:text-gray-400">Loading posts...</p>}
        {isPublicationsError && publicationsError && (
          <p className="text-center text-red-500">Error loading posts: {publicationsError.message}</p>
        )}
        {!isLoadingPublications && !isPublicationsError && (!publicationsData?.items || publicationsData.items.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            This profile hasn't made any posts yet.
          </p>
        )}
        {publicationsData?.items && publicationsData.items.length > 0 && (
          <div className="space-y-6">
            {publicationsData.items.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
            {/* TODO: Add pagination for publications using publicationsData.pageInfo */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;