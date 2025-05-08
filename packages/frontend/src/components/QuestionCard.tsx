import { PublicationFragment, ProfileFragment } from '@lens-protocol/client';
import Link from 'next/link';
import { ChatBubbleOvalLeftEllipsisIcon, ArrowUpCircleIcon, EyeIcon } from '@heroicons/react/24/outline'; // Using Heroicons

// Helper to get a displayable image URL from Lens MediaSet
const getProfilePictureUrl = (profile: ProfileFragment): string | null => {
  if (profile.picture && profile.picture.__typename === 'MediaSet') {
    return profile.picture.optimized?.uri || profile.picture.original?.uri || null;
  }
  if (profile.picture && profile.picture.__typename === 'NftImage') {
    return profile.picture.image.optimized?.uri || profile.picture.image.original?.uri || null;
  }
  return '/default-avatar.png'; // Fallback placeholder
};

interface QuestionCardProps {
  pub: PublicationFragment; // Assuming PostFragment is compatible or you adjust
}

const QuestionCard: React.FC<QuestionCardProps> = ({ pub }) => {
  if (pub.__typename !== 'Post' && pub.__typename !== 'Comment' && pub.__typename !== 'Mirror' && pub.__typename !== 'Quote') {
    // Or handle other types if necessary. For now, only render Post-like content.
    return null;
  }

  const profile = pub.by;
  const metadata = pub.metadata;
  const stats = pub.stats;

  const profilePictureUrl = getProfilePictureUrl(profile);

  // Extract title and content more robustly
  let title = "Untitled Question";
  let contentSnippet = "No content available.";

  if (metadata && metadata.__typename === 'TextOnlyMetadataV3') {
    // For TextOnly, content is the main field. Let's treat it as the question.
    title = metadata.content.length > 100 ? metadata.content.substring(0, 97) + "..." : metadata.content;
    contentSnippet = metadata.content; // Or a snippet if you prefer
  } else if (metadata && metadata.__typename === 'ArticleMetadataV3') {
    title = metadata.title || "Untitled Question";
    contentSnippet = metadata.content.length > 150 ? metadata.content.substring(0, 147) + "..." : metadata.content;
  }
  // Add more metadata type checks as needed (e.g., LinkMetadataV3, ImageMetadataV3 etc.)

  const tags = metadata?.__typename.endsWith('V3') && 'tags' in metadata ? metadata.tags : [];

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start space-x-4 mb-4">
        <img
          src={profilePictureUrl || '/default-avatar.png'} // Fallback avatar
          alt={profile.handle?.fullHandle || 'User avatar'}
          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
        />
        <div>
          <Link href={`/profile/${profile.handle?.fullHandle || profile.id}`} className="text-lg font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            {title}
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Asked by{' '}
            <Link href={`/profile/${profile.handle?.fullHandle || profile.id}`} className="font-medium hover:underline">
              {profile.handle?.fullHandle || `ID: ${profile.id.substring(0,10)}...`}
            </Link>
            {' on '}
            {new Date(pub.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Optional: Display content snippet if different from title */}
      {/* <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
        {contentSnippet}
      </p> */}

      {tags && tags.length > 0 && (
        <div className="mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block bg-slate-200 dark:bg-slate-700 rounded-full px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 mr-2 mb-2"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <ArrowUpCircleIcon className="w-5 h-5 mr-1 text-green-500" /> {stats?.upvotes || 0} Upvotes
          </span>
          <span className="flex items-center">
            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1 text-blue-500" /> {stats?.comments || 0} Answers
          </span>
        </div>
        <Link href={`/post/${pub.id}`} className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default QuestionCard;