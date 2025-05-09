import { NextPage } from "next";
import Link from 'next/link';
// Import hooks and types from @lens-protocol/react-web for V3
import {
  useExplorePublications,
  ExplorePublicationType,
  ExplorePublicationsOrderByType,
  LimitType // Assuming LimitType is also exported here or from @lens-protocol/client
} from '@lens-protocol/react-web';
// Import types from @lens-protocol/client for data structure (PostFragment)
import { PostFragment } from '@lens-protocol/client';

import QuestionCard from "@/components/QuestionCard";
import QuestionCardSkeleton from "@/components/QuestionCardSkeleton";
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const Home: NextPage = () => {
  const { data: publications, error, loading: isLoading } = useExplorePublications({
    limit: LimitType.TwentyFive, // V3 SDK uses Enums like this
    orderBy: ExplorePublicationsOrderByType.Latest,
    where: {
      publicationTypes: [ExplorePublicationType.Post],
      // metadata: { // Optional: Filter for your app's questions
      //   tags: { oneOf: ["lin-question-app"] } // Use your appId or a specific tag
      // }
    }
  });

  console.log("useExplorePublications data:", publications);
  console.log("useExplorePublications error:", error);
  console.log("useExplorePublications isLoading:", isLoading);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-grow">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl tracking-tight">
              Latest Questions (Lens V3)
            </h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Explore the latest discussions and insights from the community.
            </p>
          </div>
          <Link href="/ask" legacyBehavior>
            <a className="ml-4 flex-shrink-0 btn btn-primary bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Ask Question
            </a>
          </Link>
        </div>

        {isLoading && (!publications || publications.length === 0) && (
          <div className="space-y-6">
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

        {!isLoading && !error && publications && publications.length === 0 && (
          <div className="bg-sky-100 dark:bg-sky-900 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-4 rounded-md shadow-md" role="alert">
            <div className="flex">
              <div className="py-1">
                <InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" />
              </div>
              <div>
                <p className="font-bold">No Questions Yet</p>
                <p className="text-sm">It looks like there are no questions matching the criteria. Why not ask one?</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && publications && publications.length > 0 && (
          <div className="space-y-6">
            {publications.map((p) => (
              // Cast 'p' to PostFragment as QuestionCard might expect specific fields
              <QuestionCard key={p.id} pub={p as PostFragment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
