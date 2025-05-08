import { useState } from "react";
import { lensClient } from "@/lib/lensClient";
import { PublicationId } from "@lens-protocol/client";

interface AnswerComposerProps {
  parentId: PublicationId;
}

export default function AnswerComposer({ parentId }: AnswerComposerProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) {
      setError("Answer cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      /* TODO: Upgrade to Lens Metadata V2 and upload JSON to IPFS */
      const metadata = {
        description: `Answer to publication ${parentId}`,
        content: text,
        attributes: [],
        locale: "en",
        appId: "lin-question-app",
      };

      const contentURI =
        typeof window === 'undefined'
          ? `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`
          : `data:application/json;base64,${window.btoa(JSON.stringify(metadata))}`;

      /* TODO: Use dispatcher flow if enabled */
      const result = await lensClient.publication.commentOnchain({
        commentOn: parentId,
        contentURI: contentURI,
      });

      // TODO: Inspect result shape for success
      if ((result as any).txHash) {
        setSuccess("Answer submitted successfully!");
        setText("");
      } else {
        setError("Submission failed (unknown).");
      }
    } catch (err: any) {
      const graphQLError = err.response?.errors?.[0]?.message;
      setError(graphQLError || err.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2">Your Answer</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border p-2 rounded bg-white dark:bg-gray-800"
        rows={5}
        placeholder="Write your answer here..."
        disabled={isSubmitting}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-1">{success}</p>}
      <button
        onClick={submit}
        className="btn btn-secondary mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded disabled:opacity-50"
        disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? "Submitting..." : "Post Answer"}
      </button>
    </div>
  );
}
