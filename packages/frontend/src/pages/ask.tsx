'use client'; // If using App Router, this page likely needs to be a client component for useState and onClick

import { useState } from "react";
import { lensClient } from "@/lib/lensClient"; // Assuming this is correctly set up
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // For feedback

export default function AskPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState(""); // Optional: for comma-separated tags
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Simple character limit for demonstration
  const MAX_BODY_LENGTH = 1000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(null);
    setSuccess(null);

    if (!title.trim() || !body.trim()) {
      setError("Please provide both a title and a question body.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement proper metadata construction
      // This is a placeholder for the actual metadata you'll build
      const metadata = {
        version: '2.0.0', // Example Lens metadata version
        metadata_id: `question-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        description: `Question: ${title}`, // Or use body for description
        content: body, // The main question content
        name: title, // Title of the post
        attributes: [
          {
            traitType: 'type',
            value: 'question',
          },
          // Add more attributes, e.g., for bounty if implemented
        ],
        // external_url: 'YOUR_APP_URL/question/ID_HERE', // Link back to your app
        // image: 'URL_TO_AN_IMAGE_IF_ANY',
        // app_id: 'YOUR_LENS_APP_ID', // Your Lens app ID
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Process tags
        // locale: 'en-US', // Example
      };

      console.log("Submitting with metadata:", metadata);

      // IMPORTANT: Replace with actual lensClient.publication.postOnchain call
      // For now, simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      // const result = await lensClient.publication.postOnchain({
      //   contentURI: `data:application/json,${JSON.stringify(metadata)}`,
      //   // ... other necessary parameters for postOnchain (e.g., profileId if needed)
      //   // ... openActionModules for bounty if you implement that
      // });
      // console.log("Publication result:", result);

      setSuccess("Your question has been submitted successfully!");
      setTitle("");
      setBody("");
      setTags("");
    } catch (err: any) {
      console.error("Error submitting question:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 sm:py-12">
      <section className="max-w-2xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-6 text-center">
          Ask a Public Question
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">
          Your question will be posted onchain. Be clear and concise.
          {/* TODO: Add link to guidelines or more info here */}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Question Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to integrate WalletConnect with Next.js?"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isLoading}
              maxLength={150} // Example max length
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              A short, descriptive title for your question.
            </p>
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Your Question
            </label>
            <textarea
              id="body"
              name="body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe your question in detail. Include any relevant context, code snippets, or what you've already tried."
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isLoading}
              maxLength={MAX_BODY_LENGTH}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
              {body.length}/{MAX_BODY_LENGTH} characters
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., nextjs, web3, lens-protocol"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Comma-separated tags to help categorize your question.
            </p>
          </div>

          {/* TODO: Add Bounty Module configuration UI here if needed */}
          {/* <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">Set a Bounty (Optional)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              (Bounty module integration needed)
            </p>
             Inputs for bounty amount, currency, etc.
          </div> */}


          {/* Feedback Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300 flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md text-sm text-green-700 dark:text-green-300 flex items-start">
              <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:text-slate-700 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit Question"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-start p-3 bg-sky-50 dark:bg-sky-900/50 border border-sky-200 dark:border-sky-700 rounded-md">
            <InformationCircleIcon className="h-6 w-6 text-sky-600 dark:text-sky-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-sky-700 dark:text-sky-300">Remember:</h3>
              <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                <li>Clearly articulate your problem or question.</li>
                <li>Provide context or examples if applicable.</li>
                <li>Check if a similar question has already been asked.</li>
                <li>Your post is permanent on the blockchain.</li>
              </ul>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}