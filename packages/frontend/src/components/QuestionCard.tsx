// src/components/QuestionCard.tsx

import Link from 'next/link';
import { ChatBubbleOvalLeftEllipsisIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

// Define a type that closely matches the example publication structure you provided
// This helps with type safety within this component.
interface KintaskPublication {
  id: string;
  __typename: 'Post' | 'Comment' | 'Mirror' | 'Quote' | string; // Allow other typenames
  author: {
    __typename: 'Account';
    address: string;
    username?: { // Username might be optional
      __typename: 'Username';
      fullHandle: string; // e.g., "lens/stani" or "test/dave"
      localName: string;
      namespace: string;
    } | null;
    metadata?: { // Profile metadata for picture
      __typename: 'ProfileMetadata';
      picture?: {
        __typename: 'ImageSet'; // Assuming ImageSet for profile pictures based on typical Lens structure
        optimized?: { uri: string } | null;
        raw?: { uri: string } | null; // Or 'original' if that's the field name
      } | null;
    } | null;
  };
  metadata?: {
    __typename: 'ArticleMetadata' | 'TextOnlyMetadataV3' | string; // Add other expected metadata types
    id?: string;
    title?: string | null;
    content?: string | null; // Common field for text
    tags?: string[] | null; // Common for tags
    // Add other metadata fields as needed, e.g., for images, videos
    attributes?: Array<{ traitType?: string | null, value?: string | null }> | null;
    attachments?: Array<any> | null; // For media attachments
    contentWarning?: string | null;
  } | null;
  stats?: {
    __typename: 'PostStats' | string; // Or 'PublicationStats'
    comments: number;
    collects: number;
    upvotes?: number; // If upvotes are a direct stat
    mirrors?: number;
    quotes?: number;
    // Add other stats if available, e.g., reactions or a specific "answers" count
    // If using a custom stat for "answers", ensure your backend/indexing provides it
  } | null;
  createdAt: string; // Timestamp string
  // Add any other fields your card needs from the publication object
  app?: { appId?: string } | null; // Example if you filter by appId
}

// Helper to get a displayable image URL
const getProfilePictureUrl = (author: KintaskPublication['author']): string => {
  const pictureSet = author.metadata?.picture;
  if (pictureSet) {
    return pictureSet.optimized?.uri || pictureSet.raw?.uri || '/default-avatar.png';
  }
  return '/default-avatar.png'; // Fallback placeholder
};

// Helper to get a displayable handle
const getDisplayHandle = (author: KintaskPublication['author']): string => {
  return author.username?.localName || `Account: ${author.address.substring(0, 6)}...${author.address.substring(author.address.length - 4)}`;
}

interface QuestionCardProps {
  pub: KintaskPublication; // Use the defined interface
}

const QuestionCard: React.FC<QuestionCardProps> = ({ pub }) => {
  // Ensure we only try to render Post-like structures that have an author and metadata
  if (!pub.author || !pub.metadata || (pub.__typename !== 'Post' && pub.__typename !== 'Comment')) {
    // console.warn("QuestionCard: Skipping rendering for unsupported publication type or missing data", pub.__typename);
    return null;
  }

  const profile = pub.author;
  const metadata = pub.metadata;
  const stats = pub.stats;

  const profilePictureUrl = getProfilePictureUrl(profile);
  const displayHandle = getDisplayHandle(profile);

  // Extract title and content based on metadata type
  let title = "Untitled Question";
  let contentSnippet = metadata?.content || "No content preview available."; // Default to content

  // More robust metadata handling based on __typename
  if (metadata) {
    switch (metadata.__typename) {
      case 'ArticleMetadataV3': // Assuming V3 metadata if __typename ends with V3
      case 'ArticleMetadata':
        title = metadata.title || (metadata.content ? (metadata.content.substring(0, 70) + (metadata.content.length > 70 ? "..." : "")) : "Untitled Article");
        contentSnippet = metadata.content || "No content available.";
        break;
      case 'TextOnlyMetadataV3':
      case 'TextOnlyMetadata':
        // For TextOnly, content is the main field.
        title = metadata.content ? (metadata.content.substring(0, 70) + (metadata.content.length > 70 ? "..." : "")) : "Untitled Post";
        contentSnippet = metadata.content || "No content available.";
        break;
      // Add cases for other metadata types you expect (Image, Video, etc.)
      // case 'ImageMetadataV3':
      //   title = metadata.title || "Image Post";
      //   contentSnippet = metadata.description || "No description.";
      //   break;
      default:
        // Fallback if metadata type is unknown or not handled
        title = metadata.content ? (metadata.content.substring(0, 70) + (metadata.content.length > 70 ? "..." : "")) : (metadata.title || "Lens Publication");
        contentSnippet = metadata.content || "Content not directly extractable for this metadata type.";
        break;
    }
  }
  // Ensure title is not overly long for display
  if (title.length > 70) title = title.substring(0, 67) + "...";
  if (contentSnippet.length > 150) contentSnippet = contentSnippet.substring(0, 147) + "...";


  const tags = metadata?.tags || [];

  // Determine the link to the full question/post detail page
  // ACTION: Update this href to your actual question detail page route
  const questionDetailUrl = `/question/${pub.id}`; // Example: `/question/${pub.id}`

  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
        <Link href={`/profile/lens/${displayHandle.replace('/', ':')}`} legacyBehavior>
          <a className="flex-shrink-0">
            <img
              src={profilePictureUrl}
              alt={`${displayHandle}'s avatar`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 hover:opacity-90 transition-opacity"
            />
          </a>
        </Link>
        <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper text truncation */}
          <Link href={questionDetailUrl} legacyBehavior>
            <a className="block text-base sm:text-lg font-semibold text-sky-600 dark:text-sky-400 hover:underline truncate" title={title}>
              {title}
            </a>
          </Link>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
            Asked by{' '}
            <Link href={`/profile/lens/${displayHandle.replace('/', ':')}`} legacyBehavior>
                <a className="font-medium hover:underline">{displayHandle}</a>
            </Link>
            {' on '}
            {new Date(pub.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Optional: Display a short snippet of the content if it's different from the title and not too long */}
      {/* This can be useful if your 'title' is just a short part of the actual question */}
      {contentSnippet && contentSnippet !== title && (
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed max-h-20 overflow-hidden relative group">
            {contentSnippet}
            {contentSnippet.length >= 147 && <span className="absolute bottom-0 right-0 bg-gradient-to-l from-white dark:from-slate-800 via-white/80 dark:via-slate-800/80 to-transparent w-1/3 h-full group-hover:hidden"></span>}
        </p>
      )}


      {tags && tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.slice(0, 5).map((tag, index) => ( // Display up to 5 tags
            <span
              key={`${tag}-${index}`}
              className="inline-block bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3 mt-auto">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="flex items-center" title="Upvotes/Reactions">
            <ArrowUpCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-green-500" /> {stats?.upvotes || stats?.collects || 0} {/* Prefer upvotes, fallback to collects */}
          </span>
          <span className="flex items-center" title="Comments/Answers">
            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-blue-500" /> {stats?.comments || 0}
          </span>
          {/* Add other stats like Mirrors or Quotes if desired */}
        </div>
        <Link href={questionDetailUrl} legacyBehavior>
          <a className="text-kintask-blue dark:text-sky-400 hover:underline font-medium text-xs sm:text-sm">
            View Question & Answers
          </a>
        </Link>
      </div>
    </div>
  );
};

export default QuestionCard;