import { NextPage } from "next";
import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // Import React hooks

// Assuming fetchPosts and client are correctly imported and configured from your Lens setup
import { fetchPosts } from "@lens-protocol/client/actions"; // Or your specific import
import { client } from "../lib/client";                 // Or your specific import

import QuestionCard from "@/components/QuestionCard";
import QuestionCardSkeleton from "@/components/QuestionCardSkeleton";
import SimplePostCreator from "@/components/SimplePostCreator";
import ProfileCreator from "@/components/ProfileCreator";
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Define a generic type for publications if not using specific Lens types
// This allows flexibility if the exact Lens SDK version types are not strictly enforced here.
// For QuestionCard to work, it must be compatible with this structure.
interface GenericPublication {
  id: string; // All Lens publications have an ID
  // Add other common fields your QuestionCard might expect
  // e.g., metadata.content, profile.handle, stats, etc.
  [key: string]: any; // Allow other properties
}

interface FetchError {
  message: string;
}

const Home: NextPage = () => {
  // --- State variables managed by React ---
  const [publications, setPublications] = useState<GenericPublication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start in loading state
  const [error, setError] = useState<FetchError | null>(null);
  // const [pageInfo, setPageInfo] = useState<any>(null); // For pagination if implemented

  // --- Fetch data on component mount ---
  useEffect(() => {
    const loadPosts = async () => {
      console.log("[IndexPage] useEffect: Fetching initial posts...");
      setIsLoading(true); // Set loading before the async call
      setError(null);     // Clear any previous errors

      try {
        // Assuming 'client' is correctly typed for fetchPosts
        // The second argument to fetchPosts is its options/filter object.
        // For LensTask, you need to define how to filter for questions.
        // Example: Filtering by a specific metadata tag.

        const result = await fetchPosts(client, {
          filter: {
            metadata: {
              // contentWarning: { oneOf: [ContentWarning.Sensitive] },
              // mainContentFocus: [MainContentFocus.Image],
              tags: { all: ["lens-task-test-v2", "question"] },
            },
          },

        });

        if (result.isErr()) {
          console.error("[IndexPage] useEffect: Error fetching posts:", result.error.message);
          setError({ message: result.error.message });
          setPublications([]); // Ensure publications is empty on error
        } else {
          // items: Array<AnyPost> or similar type from your Lens SDK
          const { items /*, pageInfo */ } = result.value;
          console.log(items)
          console.log("[IndexPage] useEffect: Posts fetched, count:", items.length);
          setPublications(items as GenericPublication[]); // Update state with fetched items
          // setPageInfo(pageInfo); // Store for pagination
        }
      } catch (e: any) {
        // Catch any unexpected errors during the fetchPosts call itself
        console.error("[IndexPage] useEffect: Unexpected error during fetchPosts:", e);
        setError({ message: e.message || "An unexpected error occurred while fetching posts." });
        setPublications([]);
      } finally {
        setIsLoading(false); // Set loading to false after attempt (success or fail)
      }
    };

    loadPosts(); // Call the async function
  }, []); // Empty dependency array means this runs once when the component mounts

  // The console.logs outside useEffect will run on every render,
  // initially showing the default state values.
  // To see updated values, log inside useEffect or use React DevTools.
  // console.log("[IndexPage] Render - isLoading:", isLoading);
  // console.log("[IndexPage] Render - publications count:", publications.length);
  // console.log("[IndexPage] Render - error:", error);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-grow">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl tracking-tight">
              Latest LensTask Questions
            </h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Explore verifiable Q&A from the community.
            </p>
          </div>
          {/* ACTION: Update this link to your page for asking LensTask questions */}
          {/* <Link href="/ask-LensTask" legacyBehavior>
            <a className="ml-4 flex-shrink-0 btn btn-primary bg-LensTask-blue hover:bg-LensTask-blue-dark text-white px-4 py-2 rounded-md shadow-sm font-semibold">
              Ask LensTask
            </a>
          </Link> */}
        </div>

        {/* Profile Creator Section */}
        <div className="my-8 p-6 bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          {/* <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">Manage Your Lens Profile</h2> */}
          <ProfileCreator />
        </div>
        {/* End Profile Creator Section */}

        <div className="my-8 p-6 bg-white dark:bg-slate-800 shadow-xl rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">Questions</h2>
           {/* Ensure this adds the correct tags/appId for LensTask questions if used for that */}
        </div>

        {/* Conditional Rendering based on state */}
        <div className="mt-10">
          {isLoading && publications.length === 0 && ( // Show skeletons only during initial load
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">Loading Questions...</h3>
              {[...Array(3)].map((_, i) => ( // Display a few skeletons
                <QuestionCardSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
              <div className="flex">
                <div className="py-1">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
                </div>
                <div>
                  <p className="font-bold">Error Loading Questions</p>
                  <p className="text-sm">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && publications.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <InformationCircleIcon className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No LensTask Questions Found</p>
              <p className="text-sm mt-1">Be the first to ask a verifiable question using the "Ask LensTask" button!</p>
            </div>
          )}

          {!isLoading && !error && publications.length > 0 && (
            <div className="space-y-6">
              {publications.map((p) => (
                // Pass the publication object to QuestionCard.
                // QuestionCard needs to be able to handle the structure of 'p'.
                <QuestionCard key={p.id} pub={p} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;