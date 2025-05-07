import { useState } from "react";
import { lensClient } from "@/lib/lensClient";

export default function AskPage() {
  const [body, setBody] = useState("");

  const submit = async () => {
    // TODO build metadata + bounty module data
    await lensClient.publication.postOnchain({
      // stub
    });
  };

  return (
    <section className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-2">Ask a question</h1>
      <textarea
        className="w-full border p-2"
        rows={6}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={submit} className="btn btn-primary mt-3">
        Submit
      </button>
    </section>
  );
}
