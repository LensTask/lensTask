// src/components/AnswerComposer.tsx

import { useState } from "react";
import { useAppContext } from '../context/useAppState';
import useSessionClient from '../lib/useSessionClient';

interface AnswerComposerProps {
  parentId: string;
  /** Called after a successful post: (commentId, content, yourProfileName) */
  onSuccess?: (commentId: string, content: string, profileName: string) => void;
}

export default function AnswerComposer({
  parentId,
  onSuccess,
}: AnswerComposerProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  const { state } = useAppContext();
  const { handleCommentOnPost } = useSessionClient();

  const activeProfile = state.stateActiveLensProfile;

  const submitAnswer = async () => {
    if (!activeProfile) {
      setUiError("You must be logged in with a Lens profile to post an answer.");
      return;
    }
    if (!text.trim()) {
      setUiError("Answer cannot be empty.");
      return;
    }

    setUiError(null);
    setUiSuccess(null);
    setIsSubmitting(true);

    // actually submit
    const commentResult = await handleCommentOnPost(
      text,
      parentId,
      state.stateSessionClient
    );

    const txOrId = commentResult?.value?.hash;
    const simulatedSuccess = Boolean(txOrId);

    const submittedText = text;       // capture before clearing
    if (simulatedSuccess && txOrId) {
      setUiSuccess(`✅ Post submitted! (ID/Tx: ${txOrId.substring(0, 12)}...)`);
      setText("");
      // invoke parent callback with id, content, and your handle
      onSuccess?.(txOrId, submittedText, activeProfile.username?.localName || "");
    } else {
      setUiError("Submission failed. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (!activeProfile) {
    return (
      <div className="mt-6 border-t pt-6 dark:border-gray-700">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
          Please sign in with your Lens Profile to post an answer.
          <br />
          <button
            onClick={() => alert("Login/Connect Wallet…")}
            className="mt-2 text-kintask-blue hover:underline font-semibold"
          >
            Connect Wallet & Sign In with Lens
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t pt-6 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Your Answer</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kintask-blue transition-colors placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
        rows={5}
        placeholder={`Replying as @${activeProfile.username?.localName}…`}
        disabled={isSubmitting}
        aria-label="Your answer content"
      />

      {uiError && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-2">Error: {uiError}</p>
      )}
      {uiSuccess && (
        <p className="text-green-600 dark:text-green-400 text-sm mt-2">{uiSuccess}</p>
      )}

      <button
        onClick={submitAnswer}
        disabled={isSubmitting || !text.trim()}
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
        {isSubmitting ? (
          <>
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
            Submitting…
          </>
        ) : (
          "Post Answer"
        )}
      </button>
    </div>
  );
}
