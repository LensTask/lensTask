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
      /* -------------------------------------------------------------- */
      /* TODO: switch to Lens Metadata V2 helper + upload to IPFS       */
      /* -------------------------------------------------------------- */
      const metadata = {
        description: `Answer to publication ${parentId}`,
        content: text,
        attributes: [],
        locale: "en",
        appId: "lin-question-app",
      };

      const contentURI = `data:application/json;base64,${
        typeof window === 'undefined'
          ? Buffer.from(JSON.stringify(metadata)).toString('base64')
          : window.btoa(JSON.stringify(metadata))
      }`;

      /* TODO: use dispatcher flow if enabled; fall back to typed-data */
      const result = await lensClient.publication.commentOnchain({
        commentOn: parentId,
        contentURI,
      });

      /* TODO: confirm result type in SDK 2.x */
      if ((result as any).txHash) {
        setSuccess("Answer submitted (tx pending).");
        setText("");
      } else {
        setError("Submission failed: unknown reason.");
      }
    } catch (err: any) {
      const msg = err?.response?.errors?.[0]?.message ?? err.message;
      setError(msg);
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
        className="w-full border p-2 rounded dark:bg-gray-800"
        rows={5}
        placeholder="Write your answer here…"
        disabled={isSubmitting}
      />
      {error   && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {success && <p className="text-green-500 text-sm mt-1">{success}</p>}
      <button
        onClick={submit}
        className="btn btn-secondary mt-3"
        disabled={isSubmitting || !text.trim()}
      >
        {isSubmitting ? "Submitting…" : "Post Answer"}
      </button>
    </div>
  );
}

//TODO

// 1. Replace data: URI with IPFS pin via lensClient.asset.uploadMetadata().
// 2. Attach a referenceModule (FOLLOWER_ONLY) to demonstrate follow gating.
// 3. Refresh answers list on success with React-Query invalidate.
// 4. Add ConnectKit wallet check before calling lensClient.
