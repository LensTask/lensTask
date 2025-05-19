// src/pages/profile/[handle].tsx
// OR pages/profile/[handle].tsx

import React, { useState, useEffect } from 'react'; // Import React hooks
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextPage } from 'next';

// --- LENS CLIENT SDK V2 IMPORTS ---
import {
  Account,
  AnyPublication,
  EvmAddress,
  ProfileId,
  PublicationType,
  LimitType,
  PublicationSortCriterion,
  PageInfo, // For pagination
  fetchAccount,
  fetchPosts,
} from "@lens-protocol/client/actions";
import { client } from "../../../lib/client"; // Your Lens SDK V2 client instance
// --- END LENS CLIENT SDK V2 IMPORTS ---

// Your custom components
import ProfileView from '../../../components/ProfileView';
import PublicationCard from '../../../components/PublicationCard';
import ProfilePageSkeleton from '../../../components/ProfilePageSkeleton'; // Create a skeleton for the whole page
import QuestionCardSkeleton from '../../../components/QuestionCardSkeleton'; // Create a skeleton for the whole page

import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Define a type for your error state
interface FetchError {
  message: string;
  type?: 'profile' | 'publications'; // To distinguish which fetch failed
}

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { handle: rawHandleFromQuery } = router.query; // Get handle directly from query

  // --- State Management ---
  const [profile, setProfile] = useState<Account | null>(null);
  const [publications, setPublications] = useState<AnyPublication[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [isLoadingPublications, setIsLoadingPublications] = useState<boolean>(false); // Initially true only if profile loads
  const [error, setError] = useState<FetchError | null>(null);
  const [publicationsPageInfo, setPublicationsPageInfo] = useState<PageInfo | null>(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    if (!rawHandleFromQuery) {
      // Handle case where router query is not yet available or handle is missing
      setIsLoadingProfile(false); // Stop loading if no handle
      return;
    }

    const handleParam = Array.isArray(rawHandleFromQuery) ? rawHandleFromQuery[0] : rawHandleFromQuery;

    let fullHandleForFetch: string | undefined;
    if (handleParam.includes('/')) { // e.g. lens/stani
        const parts = handleParam.split('/');
        if (parts.length === 2) fullHandleForFetch = `${parts[1]}.${parts[0]}`;
    } else if (handleParam.includes('.')) { // e.g. stani.lens
        fullHandleForFetch = handleParam;
    } else { // e.g. stani (assume .lens)
        fullHandleForFetch = `${handleParam}`;
    }

    if (!fullHandleForFetch) {
        setError({ message: "Invalid handle format.", type: 'profile' });
        setIsLoadingProfile(false);
        return;
    }

    const loadProfileAndPosts = async () => {
      setIsLoadingProfile(true);
      setError(null);
      setPublications([]); // Clear previous publications

      // 1. Fetch Profile
      console.log(`[ProfilePage useEffect] Fetching account for handle: ${fullHandleForFetch}`);
      const accountResult = await fetchAccount(client, { username: {localName: fullHandleForFetch}});

      if (accountResult.isErr()) {
        console.error("[ProfilePage useEffect] Error fetching account:", accountResult.error.message);
        setError({ message: accountResult.error.message, type: 'profile' });
        setIsLoadingProfile(false);
        return;
      }

      const fetchedProfile = accountResult.value;
      if (!fetchedProfile) {
        console.log(`[ProfilePage useEffect] Account/Profile not found for handle: ${fullHandleForFetch}`);
        // setError({ message: "Profile not found.", type: 'profile' }); // Or just show "Profile Not Found" UI
        setProfile(null); // Explicitly set to null if not found
        setIsLoadingProfile(false);
        return;
      }
      console.log(fetchedProfile)
      setProfile(fetchedProfile);
      setIsLoadingProfile(false); // Profile loading finished

      // 2. Fetch Profile's Publications (only if profile was found)
      setIsLoadingPublications(true); // Start loading publications
      const authorAddress = fetchedProfile.address as EvmAddress;

      console.log(`[ProfilePage useEffect] Fetching publications for author address: ${authorAddress}`);
      const publicationsResult = await fetchPosts(client, {
        filter: {
          authors: authorAddress, // the author's EVM address
          metadata: {
            // contentWarning: { oneOf: [ContentWarning.Sensitive] },
            // mainContentFocus: [MainContentFocus.Image],
            tags: { all: ["lens-task-test-v3", "question"] },
          },
        },
      });

      if (publicationsResult.isErr()) {
        console.error("[ProfilePage useEffect] Error fetching publications:", publicationsResult.error.message);
        setError({ message: publicationsResult.error.message, type: 'publications' });
      } else {
        setPublications(publicationsResult.value.items);
        console.log(publicationsResult.value.items)
        setPublicationsPageInfo(publicationsResult.value.pageInfo);
        console.log(`[ProfilePage useEffect] Fetched ${publicationsResult.value.items.length} publications.`);
      }
      setIsLoadingPublications(false); // Publications loading finished
    };

    loadProfileAndPosts();

  }, [rawHandleFromQuery]); // Re-run effect if the handle in the URL changes

  // --- Render Logic ---

  // Overall page loading state (while profile is being fetched)
  if (isLoadingProfile && !profile && !error) {
    // You might want a more specific skeleton for the entire profile page
    return <ProfilePageSkeleton handle={Array.isArray(rawHandleFromQuery) ? rawHandleFromQuery[0] : rawHandleFromQuery} />;
  }

  // Handle profile fetch error
  if (error && error.type === 'profile' && !profile) {
    return (
      <main className="max-w-3xl mx-auto p-4 text-center">
        <Link href="/" legacyBehavior>
          <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
            ← Back to LensTask Home
          </a>
        </Link>
        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-6 rounded-md shadow-lg mt-10" role="alert">
          <div className="flex">
            <div className="py-1"><ExclamationTriangleIcon className="h-8 w-8 text-red-500 dark:text-red-400 mr-4" /></div>
            <div>
              <p className="font-bold text-lg">Error Loading Profile</p>
              <p className="text-sm mt-1">
                Could not load data for "{Array.isArray(rawHandleFromQuery) ? rawHandleFromQuery[0] : rawHandleFromQuery}".<br />
                Details: {error.message}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle profile not found (after loading, profile is still null)
  if (!isLoadingProfile && !profile) {
    return (
      <main className="max-w-3xl mx-auto p-4 text-center">
        <Link href="/" legacyBehavior>
          <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
            ← Back to LensTask Home
          </a>
        </Link>
        <div className="bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-6 rounded-md shadow-lg mt-10" role="alert">
          <div className="flex">
            <div className="py-1"><InformationCircleIcon className="h-8 w-8 text-sky-500 dark:text-sky-400 mr-4" /></div>
            <div>
              <p className="font-bold text-lg">Profile Not Found</p>
              <p className="text-sm mt-1">The profile "@{Array.isArray(rawHandleFromQuery) ? rawHandleFromQuery[0] : rawHandleFromQuery}" could not be found.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // If profile is loaded, render its details and publications section
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
        <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
          ← Back to LensTask Home
        </a>
      </Link>

      {profile && <ProfileView profile={profile} />}

      <div className="mt-12">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          Recent Posts by {profile?.username?.fullHandle || profile?.address.substring(0,6) + "..."}
        </h2>

        {isLoadingPublications && publications.length === 0 && (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <QuestionCardSkeleton key={`pub-skeleton-${i}`} />
            ))}
          </div>
        )}

        {!isLoadingPublications && error && error.type === 'publications' && (
           <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
             <p className="font-bold">Error Loading Publications</p>
             <p className="text-sm">{error.message}</p>
           </div>
        )}

        {!isLoadingPublications && !error && publications.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <InformationCircleIcon className="h-16 w-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg">This profile hasn't made any posts matching the criteria yet.</p>
          </div>
        )}

        {!isLoadingPublications && publications.length > 0 && (
          <div className="space-y-6">
            {publications.map((pub) => (
              <PublicationCard key={pub.id} pub={pub} />
            ))}
          </div>
        )}

        {/* TODO: Implement "Load More" button using publicationsPageInfo and another fetchPosts call */}
        {/* Example:
        {publicationsPageInfo?.next && !isLoadingPublications && (
          <div className="text-center mt-8">
            <button onClick={loadMorePublications} disabled={isLoadingMorePublications} className="...">
              {isLoadingMorePublications ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
        */}
      </div>
    </div>
  );
};

export default ProfilePage;