// src/pages/questions/[id].tsx

import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState, useEffect } from 'react';

// --- LENS CLIENT SDK V2 IMPORTS ---
import {
  AnyPublication, // For answers (comments)
  Post,           // Specific type for the main question post
  Comment,        // Specific type for answers, if fetchPostReferences returns this
  PublicationId,
  ProfileId,      // For AcceptAnswerButton
  LimitType,
  PublicationSortCriterion,
  PageInfo,
  fetchPost,      // Use this for the main question
  fetchPostReferences // For fetching comments (answers)
} from "@lens-protocol/client/actions";
import { client } from "../../lib/client"; // Adjust path
import { postId,PostReferenceType } from "@lens-protocol/client"; // Helper to create typed PublicationId for posts

import useSessionClient from "../../lib/useSessionClient";
import AnswerComposer from "@/components/AnswerComposer";
import AcceptAnswerButton from "@/components/AcceptAnswerButton";
import QuestionDetailSkeleton from "@/components/QuestionDetailSkeleton";
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

// Define a type for error state
interface FetchError {
  message: string;
  type?: 'question' | 'answers';
}

// Define a type for publication metadata (can be shared or adapted)
interface V2PublicationMetadata {
  __typename: string;
  title?: string | null;
  content?: string | null;
  description?: string | null;
  tags?: string[] | null;
  attachments?: Array<{ item: string; type: string; }> | null;
  image?: string | null;
  media?: Array<{ item: string; type: string; }> | null;
}

// Helper to display metadata content safely for V2
const renderV2Content = (metadata: V2PublicationMetadata | null | undefined): JSX.Element => {
  if (!metadata) return <p className="text-gray-600 dark:text-gray-400">No content details available.</p>;
  const displayContent = metadata.content || metadata.description || metadata.title || "";
  const isHtml = /<[a-z][\s\S]*>/i.test(displayContent);
  if (isHtml) {
    return <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: displayContent }} />;
  }
  return <p className="whitespace-pre-line break-words text-gray-800 dark:text-gray-200">{displayContent}</p>;
};


const QuestionDetail: NextPage = () => {
  const router = useRouter();
  const { id: publicationIdFromQuery } = router.query;
  const { handleAssignResponseWinner } = useSessionClient();
  // --- State Management ---
  const [question, setQuestion] = useState<Post | null>(null); // Expecting a Post for the question
  const [answers, setAnswers] = useState<AnyPublication[]>([]); // Comments will be AnyPublication or Comment
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState<boolean>(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [answersPageInfo, setAnswersPageInfo] = useState<PageInfo | null>(null);

  // --- Data Fetching Effect ---
  useEffect(() => {
    const idFromQuery = Array.isArray(publicationIdFromQuery) ? publicationIdFromQuery[0] : publicationIdFromQuery;

    if (!idFromQuery || typeof idFromQuery !== 'string') {
      setIsLoadingQuestion(false);
      return;
    }

    // Use the postId helper to create a typed ID for fetchPost
    const questionPublicationId = postId(idFromQuery);

    const loadQuestionAndAnswers = async () => {
      setIsLoadingQuestion(true);
      setError(null);
      setQuestion(null); // Clear previous question
      setAnswers([]);   // Clear previous answers

      // 1. Fetch the Main Question (as a Post)
      console.log(`[QuestionDetail useEffect] Fetching POST with ID: ${questionPublicationId}`);
      const questionResult = await fetchPost(client, { // Use fetchPost
        post: questionPublicationId,
        // observerId: // Optional: your active profile ID if fetching with context
      });

      if (questionResult.isErr()) {
        console.error("[QuestionDetail useEffect] Error fetching question post:", questionResult.error.message);
        setError({ message: questionResult.error.message, type: 'question' });
        setIsLoadingQuestion(false);
        return;
      }

      const fetchedQuestion = questionResult.value; // Should be of type Post | null
      if (!fetchedQuestion) {
        console.log(`[QuestionDetail useEffect] Question post not found for ID: ${questionPublicationId}`);
        setQuestion(null);
        setIsLoadingQuestion(false);
        return;
      }
      // Ensure it's indeed a Post if fetchPost can return other types on error (though unlikely for success)
      if (fetchedQuestion.__typename !== 'Post') {
          console.error(`[QuestionDetail useEffect] Expected a Post, but received: ${fetchedQuestion.__typename}`);
          setError({ message: `Expected a Post, received ${fetchedQuestion.__typename}`, type: 'question'});
          setQuestion(null);
          setIsLoadingQuestion(false);
          return;
      }
      console.log(fetchedQuestion)
      setQuestion(fetchedQuestion);
      setIsLoadingQuestion(false);

      // 2. Fetch Answers (Comments) for the Question
      setIsLoadingAnswers(true);
      console.log(`[QuestionDetail useEffect] Fetching answers for question ID: ${fetchedQuestion.id}`);
      const answersResult = await fetchPostReferences(client, {
        referencedPost: fetchedQuestion.id, // Filter comments for this Post's ID
        referenceTypes: [PostReferenceType.CommentOn],
        // Ensure you are only fetching comments if using fetchPostReferences
          // publicationTypes: [PublicationType.Comment], // This filter might exist in `where` clause
      });
      console.log(answersResult)
      if (answersResult.isErr()) {
        console.error("[QuestionDetail useEffect] Error fetching answers:", answersResult.error.message);
        setError({ message: answersResult.error.message, type: 'answers' });
      } else {
        // Filter for actual comments if fetchPostReferences returns mixed types (e.g. Mirrors of comments)
        const commentsOnly = answersResult.value.items;
        setAnswers(commentsOnly);
        setAnswersPageInfo(answersResult.value.pageInfo);
        console.log(`[QuestionDetail useEffect] Fetched ${commentsOnly.length} answers (comments).`);
      }
      setIsLoadingAnswers(false);
    };

    loadQuestionAndAnswers();

  }, [publicationIdFromQuery]); // Re-run if ID changes

  // --- Render Logic ---
  if (isLoadingQuestion && !question && !error) {
    return <QuestionDetailSkeleton />;
  }

  if (error && error.type === 'question' && !question) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-kintask-blue hover:underline">
          ← Back
        </button>
        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
          <div className="flex">
            <div className="py-1"><ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" /></div>
            <div>
              <p className="font-bold">Error Loading Question</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isLoadingQuestion && !question) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-kintask-blue hover:underline">
          ← Back
        </button>
        <div className="bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-4 rounded-md shadow-md" role="alert">
          <div className="flex">
            <div className="py-1"><InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" /></div>
            <div>
              <p className="font-bold">Question Not Found</p>
              <p className="text-sm">The question ID "{publicationIdFromQuery}" could not be found or is invalid.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // `question` is now guaranteed to be a V2 `Post` type if it exists
  const questionMetadata = question?.metadata as V2PublicationMetadata | undefined;
  const questionTitle = questionMetadata?.title || questionMetadata?.content?.substring(0,70) + (questionMetadata?.content && questionMetadata.content.length > 70 ? "..." : "") || "Question Details";

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
        <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
          ← Back to All Questions
        </a>
      </Link>

      {question && (
        <article className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border dark:border-slate-700 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white break-words">
            {questionTitle}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span>By: {question.author.username?.localName || question.author.address.substring(0,6)+"..."}</span>
            <span>·</span>
            <span title={question.id}>ID: {question.id.substring(0,10)}...</span>
            <span>·</span>
            <span>Posted: {new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
          {renderV2Content(questionMetadata)}
        </article>
      )}

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Answers ({isLoadingAnswers ? 'Loading...' : answers.length})
      </h2>
      <section className="space-y-6">
        {isLoadingAnswers && answers.length === 0 && (
            [...Array(2)].map((_,i) => <div key={`answer-skel-${i}`} className="border dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md animate-pulse h-24"></div>)
        )}
        {!isLoadingAnswers && error && error.type === 'answers' && (
             <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
                 <p className="font-bold">Error Loading Answers</p>
                 <p className="text-sm">{error.message}</p>
             </div>
        )}
        {!isLoadingAnswers && answers.length === 0 && (!error || error.type !== 'answers') && (
             <p className="text-gray-500 dark:text-gray-400">No answers yet. Be the first to reply!</p>
        )}

        {answers.map((answer) => { // `answer` is of type `AnyPublication`, likely a `Comment`
          const answerMeta = answer.metadata;
          return (
            <div key={answer.id} className="border dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
              <div className="mb-2">
                {renderV2Content(answerMeta)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Answer by: {answer.author.username?.localName || answer.author?.address.substring(0,6)+"..."}
                <span className="mx-1">·</span>
                {new Date(answer.createdAt).toLocaleDateString()}
              </p>

              {question && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-600">
                    <AcceptAnswerButton

                        questionId={question.id as PublicationId}
                        feedAddress={answer.feed.address} // This is the comment's ID
                        winnerAddress={answer.author.owner} // Answerer's profile ID
                        // moduleActionId={bountyCollectModuleAddress as `0x${string}`} // Re-evaluate bounty module for V2
                    />
                  </div>
              )}
            </div>
          );
        })}
        {/* TODO: Implement "Load More" answers if answersPageInfo.next exists */}
      </section>

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      {question && (
        <AnswerComposer parentId={question.id as PublicationId} />
      )}
    </main>
  );
};

export default QuestionDetail;