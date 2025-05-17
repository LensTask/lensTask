// src/components/AcceptAnswerButton.tsx

import { useState } from 'react';
import useSessionClient from '../lib/useSessionClient';
import { useAppContext } from '../context/useAppState';

export default function AcceptAnswerButton({
  questionId,
  feedAddress,
  winnerAddress,
  onSuccess,
}: {
  questionId: string;
  feedAddress: `0x${string}`;
  winnerAddress: `0x${string}`;
  onSuccess?: () => void;
}) {
  const { state } = useAppContext();
  const { handleAssignResponseWinner } = useSessionClient();
  const [isPending, setIsPending] = useState(false);

  const accept = async () => {
    try {
      setIsPending(true);
      await handleAssignResponseWinner(
        state.stateSessionClient,
        state.stateActiveLensProfile,
        feedAddress,
        questionId,
        winnerAddress
      );
      onSuccess?.();
    } catch {
      // handle error if desired
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={accept}
      disabled={isPending}
      className="
        w-full sm:w-auto
        inline-flex justify-center items-center
        px-6 py-3
        border border-transparent
        text-base font-medium rounded-md shadow-sm
        text-white bg-sky-600 hover:bg-sky-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
        disabled:bg-slate-400 dark:disabled:bg-slate-500
        disabled:text-slate-700 dark:disabled:text-slate-400
        disabled:cursor-not-allowed
        transition-colors duration-150
      "
    >
      {isPending && (
        <svg
          className="animate-spin -ml-2 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {isPending ? 'Processing…' : 'Accept & Pay (Sign EIP-712)'}
    </button>
  );
}
