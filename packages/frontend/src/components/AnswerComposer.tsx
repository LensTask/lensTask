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
      setUiSuccess(`✅ Post submitted! (ID/Tx: ${txOrId.substring(0,12)}...)`);
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
        className="mt-4 px-6 py-2 bg-kintask-blue text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kintask-blue transition-opacity"
        disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? "Submitting Answer..." : "Post Answer"}
      </button>
    </div>
  );
}
