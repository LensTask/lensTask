import { NextPage } from "next";
import { useQuery } from "@tanstack/react-query";
import { lensClient } from "@/lib/lensClient";
import QuestionCard from "@/components/QuestionCard";
// Import types needed for fetchAll and QuestionCard
import { PublicationFragment, LimitType, PublicationType } from '@lens-protocol/client';

const Home: NextPage = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["latestPublications"], // Descriptive query key
    queryFn: async () => {
      console.log("Fetching latest publications for QuestionCards...");
      try {
        // Use publication.fetchAll with V2 style parameters
        const result = await lensClient.publication.fetchAll({
          limit: LimitType.Twenty, // Fetch more posts, e.g., 20
          where: {
            publicationTypes: [PublicationType.Post], // Ensure fetching Posts
            // Add more filters if needed, e.g., metadata filter for your app ID
            // metadata: { tags: { oneOf: ["lin-question"] } } // Example filter
          }
        });
        console.log("Fetched publications for cards:", result.items);
        return result;
      } catch (fetchError: any) {
        console.error("Error fetching publications for cards:", fetchError);
        // Extract GraphQL errors if available for better debugging
        const errorMessage = fetchError.response?.errors?.[0]?.message || fetchError.message;
        throw new Error(errorMessage); // Re-throw with specific message
      }
    }
  });

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Latest questions</h1>

      {isLoading && <p>Loading questions...</p>}

      {error && <p className="text-red-500">Error loading questions: {error.message}</p>}

      {data?.items && data.items.length === 0 && !isLoading && (
        <p className="text-gray-500">No questions found matching the criteria.</p>
      )}

      {/* Map over fetched items and render QuestionCard */}
      {data?.items.map((p) => (
         // Ensure QuestionCard uses the correct prop 'pub'
         // and PublicationFragment type
        <QuestionCard key={p.id} pub={p as PublicationFragment} />
      ))}
    </main>
  );
};

export default Home;
