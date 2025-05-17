// src/pages/questions/[id].tsx

import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState, useEffect } from 'react';

import { useContractRead, useAccount, useSignMessage, useWalletClient } from 'wagmi';
import { getNftAddress, getPostActionAddress } from '../../lib/utils';

// --- LENS CLIENT SDK V2 IMPORTS ---
import {
  AnyPublication, // For answers (comments)
  Post,           // Specific type for the main question post
  PublicationId,
  PageInfo,
  fetchPost,      // Use this for the main question
  fetchPostReferences // For fetching comments (answers)
} from "@lens-protocol/client/actions";
import { client } from "../../lib/client"; // Adjust path
import { postId, PostReferenceType, WhoExecutedActionOnPostQuery } from "@lens-protocol/client";

import useSessionClient from "../../lib/useSessionClient";
import AnswerComposer from "@/components/AnswerComposer";
import AcceptAnswerButton from "@/components/AcceptAnswerButton";
import QuestionDetailSkeleton from "@/components/QuestionDetailSkeleton";
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';


interface FetchError {
  message: string;
  type?: 'question' | 'answers';
}

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

const renderV2Content = (metadata: V2PublicationMetadata | null | undefined): JSX.Element => {
  if (!metadata) {
    return <p className="text-gray-600 dark:text-gray-400">No content details available.</p>;
  }
  const displayContent = metadata.content || metadata.description || metadata.title || "";
  const isHtml = /<[a-z][\s\S]*>/i.test(displayContent);
  if (isHtml) {
    return (
      <div
        className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
    );
  }
  return (
    <p className="whitespace-pre-line break-words text-gray-800 dark:text-gray-200">
      {displayContent}
    </p>
  );
};

const QuestionDetail: NextPage = () => {
  const router = useRouter();
  const { id: publicationIdFromQuery } = router.query;
  const { address: connectedAddress, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { handleAssignResponseWinner } = useSessionClient();

  // State
  const [question, setQuestion] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<AnyPublication[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [answersPageInfo, setAnswersPageInfo] = useState<PageInfo | null>(null);
  const [executedCount, setExecutedCount] = useState(0);

  // 1️⃣ Fetch Question & Answers
  useEffect(() => {
    const idStr = Array.isArray(publicationIdFromQuery)
      ? publicationIdFromQuery[0]
      : publicationIdFromQuery;
    if (!idStr) {
      setIsLoadingQuestion(false);
      return;
    }
    const qPubId = postId(idStr);

    (async () => {
      setIsLoadingQuestion(true);
      setError(null);

      // Fetch the question
      const qRes = await fetchPost(client, { post: qPubId });
      if (qRes.isErr() || !qRes.value || qRes.value.__typename !== 'Post') {
        setError({ message: qRes.isErr() ? qRes.error.message : 'Question not found', type: 'question' });
        setIsLoadingQuestion(false);
        return;
      }
      setQuestion(qRes.value);
      setIsLoadingQuestion(false);

      // Fetch the answers
      setIsLoadingAnswers(true);
      const aRes = await fetchPostReferences(client, {
        referencedPost: qRes.value.id,
        referenceTypes: [PostReferenceType.CommentOn],
      });
      if (aRes.isErr()) {
        setError({ message: aRes.error.message, type: 'answers' });
      } else {
        setAnswers(aRes.value.items);
        setAnswersPageInfo(aRes.value.pageInfo);
      }
      setIsLoadingAnswers(false);
    })();
  }, [publicationIdFromQuery]);

  // 2️⃣ Fetch executor count
  useEffect(() => {
    if (!question?.id) return;
    (async () => {
      const res = await client.query(WhoExecutedActionOnPostQuery, {
        request: { post: postId(question.id), reference: PostReferenceType.Post },
      });
      setExecutedCount(res.isErr() ? 0 : res.value.items.length);
    })();
  }, [question]);

  // 3️⃣ Read on-chain winner
  const minimalAbi = [
    {
      inputs: [
        { internalType: 'address', name: 'feed', type: 'address' },
        { internalType: 'uint256', name: 'postId', type: 'uint256' },
      ],
      name: 'getBountyWinner',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  console.log("chainId:", chainId);
  const contractAddress = chainId
    ? (getPostActionAddress(chainId) as `0x${string}`)
    : ("0x0000000000000000000000000000000000000000" as `0x${string}`);
  console.log("contractAddress:", contractAddress);

  const {
    data: winnerAddressRaw,
    isLoading,
    isError,
    error: readError,
  } = useContractRead({
    address: contractAddress!,
    abi: minimalAbi,
    functionName: "getBountyWinner",
    args: question
      ? [question.feed.address, BigInt(question.id)]
      : undefined,
    chainId,
    watch: false,
    query: { enabled: Boolean(question && chainId) },
  });

  useEffect(() => {
    console.log("⏳ isLoading:", isLoading);
    console.log("❌ isError:", isError, readError);
    console.log("✅ winnerAddressRaw:", winnerAddressRaw);
  }, [isLoading, isError, readError, winnerAddressRaw]);

  const winnerAddress = typeof winnerAddressRaw === "string"
    ? winnerAddressRaw.toLowerCase()
    : undefined;

  // 4️⃣ Loading & error states
  if (isLoadingQuestion && !question && !error) {
    return <QuestionDetailSkeleton />;
  }
  if (error?.type === 'question') {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-kintask-blue hover:underline">
          ← Back
        </button>
        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
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
            <InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" />
            <div>
              <p className="font-bold">Question Not Found</p>
              <p className="text-sm">The question ID "{publicationIdFromQuery}" could not be found.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 5️⃣ Render
  const metadata = question.metadata as V2PublicationMetadata;
  const parsed = JSON.parse(metadata.content || "{}");
  const questionTitle = parsed.title || "Question Details";
  const questionBody = parsed.body || "";

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
        <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-sm">
          ← Back to All Questions
        </a>
      </Link>

      <article className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border dark:border-slate-700 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white break-words">
          {questionTitle}
        </h1>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span>
            By: {question.author.username?.localName || question.author.address.substring(0, 6) + "..."}
          </span>
          <span>·</span>
          <span title={question.id}>ID: {question.id.substring(0, 10)}...</span>
          <span>·</span>
          <span>
            Posted: {new Date(question.timestamp).toLocaleDateString()}{" "}
            {new Date(question.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
          {questionBody}
        </div>
      </article>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        Answers ({isLoadingAnswers ? "Loading..." : answers.length})
      </h2>
      <section className="space-y-6">
        {isLoadingAnswers && answers.length === 0 && Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="border dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md animate-pulse h-24"
          />
        ))}

        {error?.type === 'answers' && (
          <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-md shadow-md" role="alert">
            <p className="font-bold">Error Loading Answers</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {!isLoadingAnswers && answers.length === 0 && !error && (
          <p className="text-gray-500 dark:text-gray-400">No answers yet. Be the first to reply!</p>
        )}

        {answers.map(answer => {
          const answerMeta = answer.metadata as V2PublicationMetadata;
          const authorAddr = answer.author.owner.toLowerCase();

          const canAccept =
            isConnected &&
            question!.author.owner.toLowerCase() === connectedAddress?.toLowerCase() &&
            executedCount === 0;

          const isWinner = winnerAddress === authorAddr;

          return (
            <div
              key={answer.id}
              className={`border p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:border-gray-700 ${
                isWinner
                  ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                  : ""
              }`}
            >
              <div className="mb-2">{renderV2Content(answerMeta)}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Answer by:{" "}
                {answer.author.username?.localName || answer.author.address.substring(0, 6) + "..."}
                <span className="mx-1">·</span>
                {new Date(answer.timestamp).toLocaleDateString()}{" "}
                {new Date(answer.timestamp).toLocaleTimeString()}
              </p>

              {isWinner && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded">
                  Winner 🎉
                </span>
              )}

              {canAccept && (
                <div className="mt-3 pt-3 border-t dark:border-gray-600">
                  <AcceptAnswerButton
                    questionId={question!.id as PublicationId}
                    feedAddress={answer.feed.address}
                    winnerAddress={answer.author.owner}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      {question && <AnswerComposer parentId={question.id as PublicationId} />}
    </main>
  );
};

export default QuestionDetail;
