import { NextPage } from "next";
import { useQuery } from "@tanstack/react-query";
import { lensClient } from "@/lib/lensClient";
import QuestionCard from "@/components/QuestionCard";
// Import types including LimitType and PublicationType for V1.3.1 style if needed
import { PublicationFragment, LimitType, PublicationType } from '@lens-protocol/client';

const Home: NextPage = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["latestPublications"], // Use a descriptive query key
    queryFn: async () => {
      console.log("Fetching publications for QuestionCards...");
      try {
        // Use the fetchAll call that worked previously
        const result = await lensClient.publication.fetchAll({
          limit: LimitType.Ten, // Or use number 10 if LimitType causes issues with 1.3.1 build
          where: {
            publicationTypes: [PublicationType.Post], // Filter by Post type
          }
        });
        console.log("Fetched publications for cards:", result.items);
        return result;
      } catch (fetchError) {
        console.error("Error fetching publications for cards:", fetchError);
        throw fetchError; // Re-throw error for react-query
      }
    }
  });

  return (
    <main className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Latest questions</h1>

      {isLoading && <p>Loading questions...</p>}

      {error && <p>Error loading questions: {error.message}</p>}

      {data?.items && data.items.length === 0 && !isLoading && <p>No questions found.</p>}

      {/* Map over fetched items and render QuestionCard for each */}
      {data?.items.map((p) => (
         // Key needs to be unique, p.id is standard
         // Pass the full publication object as 'pub' prop
        <QuestionCard key={p.id} pub={p as PublicationFragment} />
      ))}
    </main>
  );
};

export default Home;
