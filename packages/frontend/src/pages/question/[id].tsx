import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { lensClient } from "@/lib/lensClient";
import AnswerComposer from "@/components/AnswerComposer";
import AcceptAnswerButton from "@/components/AcceptAnswerButton";
// Import Lens types
import { Post, Comment, PublicationFragment, LimitType, PublicationId } from "@lens-protocol/client";
// Import address placeholder for testing AcceptAnswerButton
import { bountyCollectModuleAddress } from '@/lib/contractAddresses';


// Helper to display metadata content safely
const renderContent = (metadata: PublicationFragment['metadata'] | null | undefined) => { // Allow null/undefined
  if (!metadata) return <p>No content available.</p>;
  const content = metadata.content || metadata.description || metadata.name || "";
  return <p className="mb-4 whitespace-pre-wrap">{content}</p>;
};

// MOCK QUESTION DATA (Used if fetch fails)
const MOCK_QUESTION_ID = "0x01-0x01"; // Placeholder ID
const MOCK_PROFILE_ID = "0x01"; // Placeholder Profile ID
const MOCK_PROFILE_HANDLE = "mockasker.lens";
const MOCK_QUESTION: PublicationFragment = {
  __typename: 'Post', // Treat it as a Post for structure
  id: MOCK_QUESTION_ID,
  by: { // Mock ProfileMinimal
    __typename: 'Profile',
    id: MOCK_PROFILE_ID,
    handle: { __typename: 'HandleInfo', fullHandle: MOCK_PROFILE_HANDLE, localName: '', namespace: '', id: '', ownedBy: ''},
    // Add other ProfileMinimal fields if needed by components, initialized to defaults
    name: null, isDefault: false, isFollowedByMe: false, ownedBy: '', signless: false, sponsor: false, picture: null, operations: { id: '', canFollow:'Unknown', canUnfollow:'Unknown', isFollowedByMe: {value: false, isFinalisedOnchain: true}, isFollowing: {value: false, isFinalisedOnchain: true} }
  },
  stats: { // Mock PublicationStats
     __typename: 'PublicationStats', id:'', comments:0, mirrors:0, quotes:0, reactions:0, collects:0, upvotes:0, downvotes:0, bookmarks:0
  },
  metadata: { // Mock MetadataOutput
    __typename: 'TextOnlyMetadataV3', // Or relevant V1/V2 metadata type
    id:'', title: 'Mock Question Title', content: 'This is mock question content because the real fetch failed.', tags: [], locale: 'en', attributes: [], encryptedWith: null, appId: 'lin-mock-app', contentWarning: null, marketplace: null
  },
  createdAt: new Date().toISOString(),
  // Add other PublicationFragment fields initialized to defaults
  momoka: null, txHash: null, isHidden: false, hiddenBy: null, comments: [], mirrors: [], openActionModules: [], referenceModule: null, quoteOn: null, reaction: null, hasCollectedByMe: false, operations: { id: '', hasReacted: false, hasBookmarked: false, hasReported: false, canComment: 'Unknown', canMirror: 'Unknown', canAct: 'Unknown', canCollect:'Unknown' }
};

export default function QuestionDetail() {
  const router = useRouter();
  const { query } = router;
  // Use the actual ID from query if available, otherwise fallback to mock
  const publicationId = query.id as PublicationId | undefined ?? MOCK_QUESTION_ID;

  // Query for the specific publication (Question)
  const { data: questionData, isLoading: isLoadingQuestion, error: questionError } = useQuery({
    queryKey: ["question", publicationId],
    queryFn: () => {
      if (!publicationId || publicationId === MOCK_QUESTION_ID) { // Don't fetch if using mock ID
           console.log("Using mock question data.");
           return Promise.resolve(MOCK_QUESTION);
      }
      console.log(`Fetching question: ${publicationId}`);
      // Use fetch, V1.3.1 might return single item or null / throw error
      return lensClient.publication.fetch({ publicationId }).catch(err => {
          console.error("Actual question fetch failed, using mock.", err);
          // Throw the specific error for display, but we'll use mock data below
          throw new Error(`Failed to fetch ${publicationId}: ${err.message}`);
          // Return mock data on error: return MOCK_QUESTION; (alternative)
      });
    },
    enabled: !!publicationId,
    retry: false, // Don't retry on error if using mock fallback
  });

  // Use fetched data if successful, otherwise use mock data, but only if an ID was present
  const displayQuestion = questionData ?? (publicationId ? MOCK_QUESTION : null);
  const displayError = questionError; // Keep track of the actual fetch error

  // Query for the comments (Answers) - Use the ID of the question being displayed
  const questionIdForComments = displayQuestion?.id;
  const { data: commentsData, isLoading: isLoadingComments, error: commentsError } = useQuery({
     queryKey: ["comments", questionIdForComments],
     queryFn: async () => {
        if (!questionIdForComments) return Promise.resolve(null);
        console.log(`Fetching comments for: ${questionIdForComments}`);
        return lensClient.publication.fetchAll({
            limit: LimitType.Fifty,
            where: {
                commentOn: questionIdForComments,
            }
        }).catch(err => {
           console.error(`Failed to fetch comments for ${questionIdForComments}`, err);
           // Return null or empty items on error to prevent breaking render
           return { items: [], pageInfo: null };
        });
     },
     enabled: !!questionIdForComments,
     retry: false,
  });


  if (!displayQuestion && isLoadingQuestion) return <p className="p-4">Loading question details...</p>;

  // If there was a fetch error BUT we have mock data, show the error alongside mock data
  const finalQuestionToRender = displayQuestion ?? MOCK_QUESTION; // Ensure we always render something if an ID was present
  const finalErrorToShow = displayError; // Show the fetch error if it occurred

  return (
    <main className="max-w-3xl mx-auto p-4">
      <button onClick={() => router.back()} className="mb-4 text-blue-500 hover:underline">
        ← Back to questions
      </button>

      {/* Display fetch error if it happened */}
      {finalErrorToShow && (
           <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
             <span className="font-medium">Error loading real data:</span> {finalErrorToShow.message}. Displaying mock data.
           </div>
       )}

      {/* Render using finalQuestionToRender */}
      <h1 className="text-2xl font-bold mb-2">{(finalQuestionToRender as Post)?.metadata?.title || (finalQuestionToRender as Post)?.metadata?.name || "Question"}</h1>
      {renderContent(finalQuestionToRender.metadata)}
      <p className="text-xs text-gray-500 mb-4">By: {finalQuestionToRender.by?.handle?.fullHandle ?? finalQuestionToRender.by?.id} | ID: {finalQuestionToRender.id}</p>

      <hr className="my-6"/>

      <h2 className="text-xl font-semibold mb-4">Answers</h2>
      <section className="space-y-4">
        {isLoadingComments && <p>Loading answers...</p>}
        {commentsError && <p className="text-red-500">Error loading answers: {commentsError.message}</p>}
        {commentsData?.items && commentsData.items.length === 0 && !isLoadingComments && <p>No answers yet (or fetch failed).</p>}

        {/* List answers (comments) */}
        {commentsData?.items.map((answer) => (
          <div key={answer.id} className="border p-3 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            {renderContent(answer.metadata)}
            <p className="text-xs text-gray-500 mt-2">Answer by: {answer.by?.handle?.fullHandle ?? answer.by?.id}</p>

            {/* TEST AcceptAnswerButton */}
            <div className="mt-2 pt-2 border-t dark:border-gray-600">
               <AcceptAnswerButton
                 questionId={finalQuestionToRender.id}
                 expertProfileId={answer.by.id}
                 moduleActionId={bountyCollectModuleAddress as `0x${string}`}
               />
            </div>
          </div>
        ))}
      </section>

      <hr className="my-6"/>

      {/* Add Answer Composer */}
      <AnswerComposer parentId={finalQuestionToRender.id} />

    </main>
  );
}
