// app/page.tsx (if using App Router)
// or pages/index.tsx (if using Pages Router)

// 'use client'; // Add this if using App Router and tanstack query directly in page
// For App router, it's better to wrap this in a client component if you use hooks like useQuery directly.

import { NextPage } from "next";
import { useQuery } from "@tanstack/react-query";
import { lensClient } from "@/lib/lensClient";
import QuestionCard from "@/components/QuestionCard";
import QuestionCardSkeleton from "@/components/QuestionCardSkeleton";
// Removed PublicationSortCriteria from this import
import { PublicationFragment, LimitType, PublicationType } from '@lens-protocol/client';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const Home: NextPage = () => {
  const { data, error, isLoading, isFetching } = useQuery({
    queryKey: ["latestQuestionsStream"],
    queryFn: async () => {
      console.log("Fetching latest publications for QuestionCards...");
      try {
        const result = await lensClient.publication.fetchAll({
          limit: LimitType.Fifty,
          where: {
            publicationTypes: [PublicationType.Post],
            // metadata: {
            //   tags: { oneOf: ["your-app-question-tag"] }
            // }
          },
          // orderBy: PublicationSortCriteria.Latest, // <--- REMOVED THIS LINE
        });
        console.log("Fetched publications for cards:", result.items);
        return result.items;
      } catch (fetchError: any) {
        console.error("Error fetching publications for cards:", fetchError);
        const errorMessage = fetchError.response?.errors?.[0]?.message || fetchError.message || "An unknown error occurred";
        throw new Error(errorMessage);
      }
    },
    // staleTime: 1000 * 60 * 5,
    // cacheTime: 1000 * 60 * 10,
  });

  const publications = data || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl tracking-tight">
            Latest Questions
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Explore the latest discussions and insights from the community.
          </p>
        </div>

        {(isLoading || isFetching) && !publications.length && (
          <div>
            {[...Array(5)].map((_, i) => (
              <QuestionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
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
          <div className="bg-sky-100 dark:bg-sky-900 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-4 rounded-md shadow-md" role="alert">
            <div className="flex">
              <div className="py-1">
                <InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" />
              </div>
              <div>
                <p className="font-bold">No Questions Yet</p>
                <p className="text-sm">It looks like there are no questions matching your criteria. Why not ask one?</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && publications.length > 0 && (
          <div className="space-y-6">
            {publications.map((p) => (
              <QuestionCard key={p.id} pub={p as PublicationFragment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;