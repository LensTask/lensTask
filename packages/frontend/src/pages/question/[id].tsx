// src/pages/questions/[id].tsx (or pages/questions/[id].tsx)
// Assuming URL structure like /questions/0x01-0x01

import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link"; // Import Link for Next.js navigation

// --- SPECULATIVE V3 SDK IMPORTS ---
// Replace with actual imports from your chosen Lens V3 React SDK package
import {
  usePublication,   // Hypothetical hook to fetch a single publication
  Publication,      // V3 type for a generic publication
  Post,             // V3 type for a Post
  PublicationId,    // V3 type for PublicationId
  LimitType,        // V3 type for limits
  // Profile,       // V3 Profile type (if needed for 'by' field)
} from '@lens-protocol/react-web'; 
// --- END SPECULATIVE IMPORTS ---

import AnswerComposer from "@/components/AnswerComposer";     // Adjust path
import AcceptAnswerButton from "@/components/AcceptAnswerButton"; // Adjust path
import { bountyCollectModuleAddress } from '@/lib/contractAddresses'; // Adjust path
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';


// Helper to display metadata content safely
const renderContent = (metadata: Publication['metadata'] | null | undefined) => {
  if (!metadata) return <p className="text-gray-600 dark:text-gray-400">No content available.</p>;
  // V3 metadata structure might differ, adjust access accordingly
  // Example: content might be in metadata.content or metadata.article.content, etc.
  const content = (metadata as any)?.content || (metadata as any)?.article?.content || (metadata as any)?.description || (metadata as any)?.name || "";
  return <p className="mb-4 whitespace-pre-line break-words text-gray-800 dark:text-gray-200">{content}</p>;
};


const QuestionDetail: NextPage = () => {
  const router = useRouter();
  const { query } = router;

  // Get publicationId from URL query
  const publicationIdFromQuery = query.id as PublicationId | undefined;

  // --- Fetch the Specific Publication (Question) using Lens V3 Hook ---
  const {
    data: question, // Type should be Publication | Post | null | undefined
    loading: isLoadingQuestion,
    error: questionError,
  } = usePublication({
    // Parameter name for fetching by ID will be defined by the V3 hook
    // It could be 'publicationId', 'forId', 'id', etc.
    forId: publicationIdFromQuery, // SPECULATIVE: Based on V2 client
    // publicationId: publicationIdFromQuery, // Another possibility
    enabled: !!publicationIdFromQuery, // Only fetch if ID is present
    // observerId: activeProfile?.id // Optional: if hook supports fetching with observer context
  });



  // Extract comments array, V3 hook might return data directly or nested { items: ... }
  const answers =  []; // Adapt based on hook's return structure

  // --- Render Logic ---
  if (isLoadingQuestion && !question) {
    return <div className="flex justify-center items-center min-h-screen"><p className="p-4 text-gray-500">Loading question details...</p></div>;
  }

  if (questionError && !question) { // If error and no question data (even mock)
    return (
      <main className="max-w-3xl mx-auto p-4">
         <button onClick={() => router.back()} className="mb-4 text-blue-500 hover:underline">
            ← Back
        </button>
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
          <div className="flex">
            <div className="py-1"><ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" /></div>
            <div>
              <p className="font-bold">Error Loading Question</p>
              <p className="text-sm">{questionError.message}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!question) { // Should be caught by error or loading, but as a fallback
    return (
        <main className="max-w-3xl mx-auto p-4">
           <button onClick={() => router.back()} className="mb-4 text-blue-500 hover:underline">
            ← Back
           </button>
           <div className="bg-sky-100 dark:bg-sky-900 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-4 rounded-md shadow-md" role="alert">
             <div className="flex">
               <div className="py-1"><InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" /></div>
               <div>
                 <p className="font-bold">Question Not Found</p>
                 <p className="text-sm">The question you are looking for could not be found.</p>
               </div>
             </div>
           </div>
        </main>
    );
  }

  // Cast to Post if you are sure it's a Post, or handle different publication types
  const questionAsPost = question as Post;

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
        <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
          ← Back to Explore Questions
        </a>
      </Link>

      {/* Display main question content */}
      <article className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 border dark:border-gray-700">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white break-words">
          {/* V3 metadata access will differ. Example: */}
          {(questionAsPost.metadata as any)?.title || (questionAsPost.metadata as any)?.name || "Question Details"}
        </h1>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span>By: {question.by?.handle?.fullHandle || question.by?.id}</span>
          <span>·</span>
          <span>ID: {question.id}</span>
          <span>·</span>
          <span>Posted: {new Date(question.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="prose dark:prose-invert max-w-none">
            {renderContent(question.metadata)}
        </div>
      </article>

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Answers ({answers.length})</h2>
      <section className="space-y-6">


        {answers.map((answer: Publication /* Use V3 Comment type if available */) => (
          <div key={answer.id} className="border dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
            <div className="prose dark:prose-invert max-w-none text-sm">
                {renderContent(answer.metadata)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Answer by: {answer.by?.handle?.fullHandle || answer.by.id}
            </p>

            {/* Integrate your AcceptAnswerButton here if it's compatible with V3 types */}
            <div className="mt-3 pt-3 border-t dark:border-gray-600">
               <AcceptAnswerButton
                 questionId={question.id as PublicationId} // Ensure type compatibility
                 expertProfileId={answer.by.id} // Ensure type compatibility
                 moduleActionId={bountyCollectModuleAddress as `0x${string}`} // Ensure this module address is relevant for V3
               />
            </div>
          </div>
        ))}

        {/* Load More Button for Answers/Comments */}

      </section>

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      {/* Add Answer Composer */}
      <AnswerComposer parentId={question.id as PublicationId} />
    </main>
  );
};

export default QuestionDetail;