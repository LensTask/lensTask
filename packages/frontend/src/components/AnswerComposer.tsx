// src/components/AnswerComposer.tsx

import { useState } from "react";
// Assuming PublicationId type can be a simple string for now if not using Lens SDK
// If you are using a typed ID from your page component, import that type.
// For example: import { PublicationId } from "@lens-protocol/client/actions";

interface AnswerComposerProps {
  parentId: string; // ID of the publication (question) being commented on
  // activeProfile prop can be added back when login is implemented
  // activeProfile?: { handle?: { fullHandle: string } | null, id: string } | null;
}

export default function AnswerComposer({ parentId }: AnswerComposerProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Local submitting state
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);

  // Placeholder for active profile - to be replaced with actual Lens session data
  const activeProfile = null; // SIMULATED: No active profile initially

  const submitAnswer = async () => {
    if (!activeProfile) {
      setUiError("You must be logged in with a Lens profile to post an answer.");
      alert("Login functionality not yet implemented. Please sign in to post an answer."); // Placeholder alert
      return;
    }
    if (!text.trim()) {
      setUiError("Answer cannot be empty.");
      return;
    }

    setUiError(null);
    setUiSuccess(null);
    setIsSubmitting(true); // Set local submitting state

    console.log(`[AnswerComposer] Pretending to submit comment on ${parentId} with content: "${text.substring(0, 50)}..."`);

    // --- SIMULATED SUBMISSION ---
    // Replace this with your actual Lens SDK `createComment` call later
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    // Simulate a successful submission for UI testing
    const simulatedSuccess = true; // Change to false to test error path

    if (simulatedSuccess) {
      setUiSuccess("Answer submitted successfully! (Simulated)");
      setText(""); // Clear input
      console.log("[AnswerComposer] Simulated submission successful.");
      // Optionally: Trigger a refetch of comments for the parent publication on the parent page
    } else {
      setUiError("Simulated submission failed. Please try again.");
      console.error("[AnswerComposer] Simulated submission failed.");
    }
    // --- END SIMULATED SUBMISSION ---

    setIsSubmitting(false); // Reset local submitting state
  };

  // --- UI when user is NOT logged in (placeholder logic) ---
  if (!activeProfile) { // This check will always be true with `activeProfile = null`
    return (
      <div className="mt-6 border-t pt-6 dark:border-gray-700">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
          Please sign in with your Lens Profile to post an answer.
          <br />
          {/* Placeholder for login button/action */}
          <button
            onClick={() => alert("Login/Connect Wallet functionality will be implemented here.")}
            className="mt-2 text-kintask-blue hover:underline font-semibold"
          >
            Connect Wallet & Sign In with Lens
          </button>
        </p>
      </div>
    );
  }

  // --- UI when user IS logged in (this part will be hidden initially) ---
  return (
    <div className="mt-6 border-t pt-6 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Your Answer</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-kintask-blue focus:border-kintask-blue transition-colors placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
        rows={5}
        placeholder={`Replying as @${activeProfile.handle?.fullHandle || activeProfile.id.substring(0,6)+'...'} Type your insightful answer here.`}
        disabled={isSubmitting}
        aria-label="Your answer content"
      />

      {uiError && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-2">
          Error: {uiError}
        </p>
      )}
      {uiSuccess && (
        <p className="text-green-600 dark:text-green-400 text-sm mt-2">{uiSuccess}</p>
      )}

      <button
        onClick={submitAnswer}
        className="mt-4 px-6 py-2 bg-kintask-blue hover:bg-kintask-blue-dark text-white font-medium rounded-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kintask-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-opacity"
        disabled={isSubmitting || !text.trim()} // Active profile check is done above
      >
        {isSubmitting ? "Submitting Answer..." : "Post Answer"}
      </button>
    </div>
  );
}