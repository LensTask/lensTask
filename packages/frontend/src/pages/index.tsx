import { NextPage } from "next";
import Link from 'next/link';
import {
  useExplorePublications,
  ExplorePublicationType,
  ExplorePublicationsOrderByType,
  LimitType
} from '@lens-protocol/react-web';
import { PostFragment } from '@lens-protocol/client';

import QuestionCard from "@/components/QuestionCard";
import QuestionCardSkeleton from "@/components/QuestionCardSkeleton";
import SimplePostCreator from "@/components/SimplePostCreator";
import ProfileCreator from "@/components/ProfileCreator"; // <--- IMPORT IT HERE
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const Home: NextPage = () => {
  const { data: publications, error, loading: isLoading } = useExplorePublications({
    limit: LimitType.TwentyFive,
    orderBy: ExplorePublicationsOrderByType.Latest,
    where: {
      publicationTypes: [ExplorePublicationType.Post],
    }
  });

  console.log("[IndexPage] useExplorePublications data:", publications);
  console.log("[IndexPage] useExplorePublications error:", error);
  console.log("[IndexPage] useExplorePublications isLoading:", isLoading);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-grow">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl tracking-tight">
              Latest Questions (Lens Testnet)
            </h1>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Explore the latest discussions from the community.
            </p>
          </div>
          <Link href="/ask" legacyBehavior>
            <a className="ml-4 flex-shrink-0 btn btn-primary bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
              Ask Question
            </a>
          </Link>
        </div>

        {/* Profile Creator Section */}
        <div className="my-8 p-4 border border-dashed border-blue-400 dark:border-blue-600 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">Manage Profile</h2>
          <ProfileCreator />
        </div>
        {/* End Profile Creator Section */}

        <div className="my-8 p-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">Test Post Creation</h2>
          <SimplePostCreator />
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
              <QuestionCard key={p.id} pub={p as PostFragment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
