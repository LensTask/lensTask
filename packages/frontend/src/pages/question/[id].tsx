// src/pages/questions/[id].tsx

import { NextPage } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from 'react';

import { useContractRead, useAccount, useWalletClient } from 'wagmi';
import { getPostActionAddress } from '../../lib/utils';

// --- LENS CLIENT SDK V2 IMPORTS ---
import {
  AnyPublication,
  Post,
  PublicationId,
  fetchPost,
  fetchPostReferences
} from "@lens-protocol/client/actions";
import { client } from "../../lib/client";
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
}

const renderV2Content = (m: V2PublicationMetadata | null | undefined): JSX.Element => {
  if (!m) return <p>No content.</p>;
  const txt = m.content || m.description || m.title || "";
  const isHtml = /<[a-z][\s\S]*>/i.test(txt);
  return isHtml
    ? <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: txt }} />
    : <p className="whitespace-pre-line">{txt}</p>;
};

const QuestionDetail: NextPage = () => {
  const router = useRouter();
  const { id: pubIdQ } = router.query;
  const { address: me, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { handleAssignResponseWinner } = useSessionClient();

  // ── State
  const [question, setQuestion] = useState<Post | null>(null);
  const [answers, setAnswers] = useState<AnyPublication[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<AnyPublication[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
  const [error, setError] = useState<FetchError | null>(null);
  const [executedCount, setExecutedCount] = useState(0);

  // ← bump this to trigger refetch on accept or new answer
  const [refreshCounter, setRefreshCounter] = useState(0);

  // ── Fetch + sort + dedupe pending
  async function fetchAnswers(qId: string) {
    setIsLoadingAnswers(true);
    const res = await fetchPostReferences(client, {
      referencedPost: qId,
      referenceTypes: [PostReferenceType.CommentOn],
    });
    if (res.isErr()) {
      setError({ message: res.error.message, type: 'answers' });
      setAnswers([]);
    } else {
      // sort newest-first
      const server = res.value.items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // build a set of "author|content" strings from the real data
      const realKeys = new Set(
        server.map(a => `${a.author.owner}|${a.metadata.content || ""}`)
      );

      // remove any pendingAnswers whose author+content now appears in the server list
      setPendingAnswers(p =>
        p.filter(pa => !realKeys.has(`${pa.author.owner}|${pa.metadata.content || ""}`))
      );

      setAnswers(server);
    }
    setIsLoadingAnswers(false);
  }

  // ── Effects
  useEffect(() => {
    const idStr = Array.isArray(pubIdQ) ? pubIdQ[0] : pubIdQ;
    if (!idStr) {
      setIsLoadingQuestion(false);
      return;
    }
    const qId = postId(idStr);
    (async () => {
      setIsLoadingQuestion(true);
      setError(null);
      const qRes = await fetchPost(client, { post: qId });
      if (qRes.isErr() || !qRes.value || qRes.value.__typename !== 'Post') {
        setError({
          message: qRes.isErr() ? qRes.error.message : 'Question not found',
          type: 'question',
        });
        setIsLoadingQuestion(false);
        return;
      }
      setQuestion(qRes.value);
      setIsLoadingQuestion(false);
      await fetchAnswers(qRes.value.id);
    })();
  }, [pubIdQ, refreshCounter]);

  useEffect(() => {
    if (!question?.id) return;
    (async () => {
      const res = await client.query(WhoExecutedActionOnPostQuery, {
        request: { post: postId(question.id), reference: PostReferenceType.Post },
      });
      setExecutedCount(res.isErr() ? 0 : res.value.items.length);
    })();
  }, [question, refreshCounter]);

  // ── On‐chain winner
  const minimalAbi = [{
    inputs: [
      { internalType: 'address', name: 'feed', type: 'address' },
      { internalType: 'uint256', name: 'postId', type: 'uint256' }
    ],
    name: 'getBountyWinner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }] as const;

  const contractAddress = chainId
    ? (getPostActionAddress(chainId) as `0x${string}`)
    : undefined;

  const {
    data: winnerRaw,
    isLoading: winnerLoading,
    refetch: refetchWinner
  } = useContractRead({
    address: contractAddress!,
    abi: minimalAbi,
    functionName: 'getBountyWinner',
    args: question ? [question.feed.address, BigInt(question.id)] : undefined,
    chainId,
    watch: false,
    query: { enabled: Boolean(question && chainId) },
  });

  const winnerAddress = typeof winnerRaw === 'string'
    ? winnerRaw.toLowerCase()
    : undefined;
  const hasWinner = executedCount > 0
    || (winnerAddress && winnerAddress !== "0x0000000000000000000000000000000000000000");

  const walletReady = !isConnected || Boolean(walletClient);

  // ── Merge pending + server, dedupe by id
  const mergedAnswers = useMemo(() => {
    const seen = new Set<string>();
    return [...pendingAnswers, ...answers].filter(ans => {
      if (seen.has(ans.id)) return false;
      seen.add(ans.id);
      return true;
    });
  }, [pendingAnswers, answers]);

  // ── Loading Gate
  if (isLoadingQuestion || isLoadingAnswers || winnerLoading || !walletReady) {
    return <QuestionDetailSkeleton />;
  }

  // ── Error UI
  if (error?.type === 'question') {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-kintask-blue hover:underline">
          ← Back
        </button>
        <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded shadow">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 dark:text-red-400 mr-3" />
          <div>
            <p className="font-bold">Error Loading Question</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }
  if (!question) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <button onClick={() => router.back()} className="mb-4 text-kintask-blue hover:underline">
          ← Back
        </button>
        <div className="bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 p-4 rounded shadow">
          <InformationCircleIcon className="h-6 w-6 text-sky-500 dark:text-sky-400 mr-3" />
          <div>
            <p className="font-bold">Question Not Found</p>
            <p className="text-sm">ID "{pubIdQ}" not found.</p>
          </div>
        </div>
      </main>
    );
  }

  // ── Final Render
  const meta = question.metadata as V2PublicationMetadata;
  const parsed = JSON.parse(meta.content || '{}');
  const title = parsed.title || 'Question Details';
  const body = parsed.body || '';

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link href="/" legacyBehavior>
        <a className="inline-block mb-6 text-kintask-blue hover:text-blue-700 dark:hover:text-blue-400 text-sm">
          ← Back to All Tasks
        </a>
      </Link>

      <article className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border dark:border-slate-700 mb-8">
        <h1 className="text-2xl font-bold mb-3 dark:text-white">{title}</h1>
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          By: {question.author.username?.localName || `${question.author.address.slice(0,6)}...`} ·
          ID: {question.id.slice(0,10)}… · {new Date(question.timestamp).toLocaleString()}
        </div>
        <div className="prose dark:prose-invert">{body}</div>
      </article>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">
        Answers ({mergedAnswers.length})
      </h2>

      <section className="space-y-6">
        {mergedAnswers.map(answer => {
          const m = answer.metadata as V2PublicationMetadata;
          const aid = answer.author.owner.toLowerCase();
          const isWinner = winnerAddress === aid;
          const canAccept = isConnected
            && !hasWinner
            && question.author.owner.toLowerCase() === me?.toLowerCase()
            && executedCount === 0;

          return (
            <div
              key={answer.id}
              className={`
                border p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:border-gray-700
                ${isWinner ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                ${hasWinner && !isWinner ? 'opacity-50 pointer-events-none' : ''}
              `}
            >
              <div className="mb-2">{renderV2Content(m)}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Answer by {answer.author.username?.localName || `${answer.author.address.slice(0,6)}...`} ·
                {new Date(answer.timestamp).toLocaleString()}
              </p>

              {isWinner && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded">
                  Accepted Answer 🎉
                </span>
              )}

              {canAccept && (
                <div className="mt-3 pt-3 border-t dark:border-gray-600">
                  <AcceptAnswerButton
                    questionId={question.id}
                    feedAddress={answer.feed.address}
                    winnerAddress={answer.author.owner}
                    onSuccess={() => {
                      setRefreshCounter(x => x + 1);
                      refetchWinner();
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <hr className="my-8 border-gray-200 dark:border-gray-700" />

      {question && !hasWinner && (
        <AnswerComposer
          parentId={question.id as PublicationId}
          onSuccess={(cid, content, profile) => {
            const fake: AnyPublication = {
              __typename: 'Comment',
              id: cid,
              metadata: { __typename: 'V2PublicationMetadata', content },
              author: {
                owner: me as string,
                username: { localName: profile },
              },
              feed: { address: question.feed.address },
              timestamp: new Date().toISOString(),
            };
            setPendingAnswers(p => [fake, ...p]);
            setRefreshCounter(x => x + 1);
            refetchWinner();
          }}
        />
      )}
    </main>
  );
};

export default QuestionDetail;
