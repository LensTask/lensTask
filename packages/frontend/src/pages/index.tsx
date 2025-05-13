import { NextPage } from "next";
import Link from 'next/link';
// Import hooks and types from @lens-protocol/react-web for V3
import {
  useExplorePublications,
  ExplorePublicationType,
  ExplorePublicationsOrderByType,
  LimitType,
  // For login/session management (if you implement login directly on this page)
  // useSession,
  // useLogin,
  // Profile
} from '@lens-protocol/react-web';
// Import types from @lens-protocol/client for data structure (PostFragment)
import { PostFragment } from '@lens-protocol/client';

import QuestionCard from "@/components/QuestionCard";
import QuestionCardSkeleton from "@/components/QuestionCardSkeleton";
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Import the component we are testing
import SimplePostCreator from '@/components/SimplePostCreator';

const Home: NextPage = () => {
  // Example: If you wanted to manage login state on this page
  // const { data: session } = useSession();
  // const { execute: login, loading: isLoginPending, error: loginError } = useLogin();
  // const activeProfile: Profile | null | undefined = session?.profile;

  // const handleLogin = async () => {
  //   // Assuming you have a way to get the wallet address (e.g., from Wagmi)
  //   // const walletAddress = "0xYourWalletAddress";
  //   // const result = await login({ address: walletAddress });
  //   // if (result.isFailure()) console.error("Login failed:", result.error.message);
  // };

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

  // console.log("useExplorePublications data:", publications);
  // console.log("useExplorePublications error:", error);
  // console.log("useExplorePublications isLoading:", isLoading);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section for testing SimplePostCreator */}
        <div className="my-8 p-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-700 dark:text-gray-300">
            Test Post Creation
          </h2>
          {/*
            The SimplePostCreator component itself checks for an active session.
            If you don't have a global login/auth flow yet, you might see its "Please log in" message.
            You would need a way to trigger login (e.g., a connect wallet button + Lens login flow)
            for the SimplePostCreator to become fully functional.
          */}
          <SimplePostCreator />
          {/* Example login button (if you were managing login state here) */}
          {/* {!activeProfile && (
            <div className="text-center mt-4">
              <button
                onClick={handleLogin}
                disabled={isLoginPending}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoginPending ? "Logging in..." : "Login with Lens"}
              </button>
              {loginError && <p className="text-red-500 mt-2">{loginError.message}</p>}
            </div>
          )} */}
        </div>
        {/* End Section for testing SimplePostCreator */}

        <hr className="my-10 border-gray-300 dark:border-gray-700" />

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
