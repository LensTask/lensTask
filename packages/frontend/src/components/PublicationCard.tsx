// components/PublicationCard.tsx
import React from 'react';
import Link from 'next/link';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  ArrowPathRoundedSquareIcon, // Assuming this is for Mirrors/Reposts
  HeartIcon, // Assuming for Likes/Upvotes/Reactions
  BookmarkIcon // Assuming for Collects/Bookmarks
} from '@heroicons/react/24/outline';
import { normalizeImageUrl } from '@/lib/utils'; // Assuming you have this utility

// --- Define a type based on YOUR provided publication structure ---
interface KintaskLensPublication {
  id: string;
  __typename: 'Post' | string; // Primarily 'Post'
  app?: {
    __typename: 'App';
    address: string;
    // Add other app fields if needed
  } | null;
  author: {
    __typename: 'Account';
    address: string;
    username?: {
      __typename: 'Username';
      fullHandle: string; // e.g., "lens/stani" or "test/dave"
      localName: string;
      namespace: string;
    } | null;
    metadata?: { // This is the PROFILE metadata
      __typename: 'ProfileMetadata';
      displayName?: string | null;
      bio?: string | null;
      picture?: { // Profile picture structure within author.metadata
        __typename: 'ImageSet' | 'NftImage' | string; // Can vary
        raw?: { uri: string; mimeType?: string | null } | null; // V2 often uses 'raw' or 'original'
        optimized?: { uri: string; mimeType?: string | null } | null;
        uri?: string; // For NftImage type
      } | null;
      // Add other profile metadata fields if you use them
    } | null;
  };
  collectibleMetadata?: { // For NFT-backed posts
    __typename: 'NftMetadata';
    // ... other NFT metadata fields
  } | null;
  commentOn?: any | null; // Structure for comments if handling them
  contentUri: string;
  feed?: any | null; // Structure for feed info
  isDeleted: boolean;
  isEdited: boolean;
  mentions?: any[] | null;
  metadata?: { // This is the PUBLICATION metadata
    __typename: 'ArticleMetadata' | 'TextOnlyMetadata' | 'ImageMetadata' | 'VideoMetadata' | string; // Adjust for other types
    id?: string; // Metadata ID
    title?: string | null;
    content?: string | null;
    description?: string | null; // Often used for text content too
    tags?: string[] | null;
    attachments?: Array<{ // For media attachments
      item: string; // URL to the asset
      type: string; // MIME type like "image/jpeg"
      altTag?: string | null;
      cover?: string | null;
    }> | null;
    image?: string | null; // Sometimes a direct image URL in metadata
    media?: Array<{ // Another common structure for media
        item: string;
        type: string;
    }> | null;
    mainContentFocus?: string[] | null;
    contentWarning?: string | null;
    // Add other relevant metadata fields
  } | null;
  operations?: any | null;
  quoteOf?: any | null;
  root?: any | null;
  rules?: any | null;
  slug?: string | null;
  snapshotUrl?: string | null;
  stats?: {
    __typename: 'PostStats' | string;
    bookmarks: number;
    collects: number;
    comments: number;
    quotes: number;
    mirrors?: number; // V2 often uses mirrors instead of reposts directly in stats
    reactions?: number; // Generic reactions
    upvotes?: number; // Check if this field exists or if you need to sum specific reaction types
  } | null;
  timestamp: string; // This is likely the 'createdAt' field
}

interface PublicationCardProps {
  pub: KintaskLensPublication;
}

const getProfilePictureUrl = (author: KintaskLensPublication['author']): string => {
  const picture = author.metadata?.picture;
  if (picture) {
    if (picture.__typename === 'ImageSet') {
      return normalizeImageUrl(picture.optimized?.uri || picture.raw?.uri);
    }
    if (picture.__typename === 'NftImage') { // NftImage usually has a direct 'uri'
      return normalizeImageUrl(picture.uri);
    }
    // If it's just a string URL (older metadata versions or direct link)
    if (typeof picture === 'string') {
        return normalizeImageUrl(picture);
    }
  }
  return '/default-avatar.png'; // Fallback
};

const getDisplayHandle = (author: KintaskLensPublication['author']): string => {
  return author.username?.fullHandle || `0x...${author.address.substring(author.address.length - 4)}`;
};

const PublicationCard: React.FC<PublicationCardProps> = ({ pub }) => {
  if (pub.__typename !== 'Post' || pub.isDeleted) {
    // Only render non-deleted Posts for this card
    return null;
  }

  const profile = pub.author;
  const metadata = pub.metadata;
  const stats = pub.stats;

  const profilePic = getProfilePictureUrl(profile);
  const displayHandle = getDisplayHandle(profile);

  let title: string | undefined | null = "Lens Publication"; // Default title
  let contentPreview: string | undefined | null = "No content preview available.";
  let mainImage: string | undefined | null;

  if (metadata) {
    // Prefer specific title field if available
    if (metadata.title) {
      title = metadata.title;
    }

    // Get content: 'content' is common, 'description' can be a fallback
    contentPreview = metadata.content || metadata.description;

    // If no title yet, use a snippet of contentPreview as title
    if (!title && contentPreview) {
      title = contentPreview.substring(0, 70) + (contentPreview.length > 70 ? '...' : '');
    }

    // Image handling: Look in attachments first, then direct image field if present
    if (metadata.attachments && metadata.attachments.length > 0) {
      const imageAttachment = metadata.attachments.find(att => att.type.startsWith('image/'));
      if (imageAttachment) {
        mainImage = normalizeImageUrl(imageAttachment.item);
      }
    } else if (metadata.image && typeof metadata.image === 'string') { // Direct image link in metadata
      mainImage = normalizeImageUrl(metadata.image);
    }
    // Add more specific checks for metadata.__typename if needed for different content structures
    // e.g., for 'VideoMetadata' you might look for video thumbnail or player
  }

  // Truncate for display
  if (title && title.length > 70) title = title.substring(0, 67) + "...";
  if (contentPreview && contentPreview.length > 200) {
    contentPreview = contentPreview.substring(0, 197) + '...';
  }

  const tags = metadata?.tags || [];
  const detailUrl = `/kintask-post/${pub.id}`; // ACTION: Update if your detail route is different

  return (
    <article className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Author Info */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
        <Link href={`/profile/${displayHandle.replace('/', ':')}`} legacyBehavior>
          <a className="flex-shrink-0">
            <img
              src={profilePic}
              alt={`${displayHandle}'s avatar`}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 hover:opacity-90"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
            />
          </a>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {profile.metadata?.displayName || displayHandle}
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <Link href={`/profile/${displayHandle.replace('/', ':')}`} legacyBehavior>
                <a className="hover:underline">@{displayHandle}</a>
            </Link>
             · {new Date(pub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {/* Use pub.timestamp */}
          </p>
        </div>
      </div>

      {/* Content */}
      <Link href={detailUrl} legacyBehavior>
        <a className="block mb-3 group">
          {title && <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 break-words mb-1 group-hover:text-kintask-blue dark:group-hover:text-sky-400 transition-colors">{title}</h3>}
          {mainImage && (
            <div className="my-3 rounded-lg overflow-hidden aspect-video bg-slate-100 dark:bg-slate-700 flex items-center justify-center"> {/* Added flex for centering */}
              <img src={mainImage} alt={title || 'Publication image'} className="max-h-80 w-auto object-contain" /> {/* Adjusted for better image display */}
            </div>
          )}
          {/* Show content preview if no main image OR if it's substantially different from a short title */}
          {contentPreview && (!mainImage || (title && contentPreview.toLowerCase() !== title.toLowerCase().replace('...', ''))) && (
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line break-words line-clamp-3">
              {contentPreview}
            </p>
          )}
        </a>
      </Link>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="inline-block bg-slate-100 dark:bg-slate-700 rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button className="flex items-center hover:text-blue-500 transition-colors" title="Comments">
            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {stats?.comments ?? 0}
          </button>
          <button className="flex items-center hover:text-green-500 transition-colors" title="Mirrors">
            <ArrowPathRoundedSquareIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {stats?.mirrors ?? 0}
          </button>
          <button className="flex items-center hover:text-red-500 transition-colors" title="Reactions/Upvotes">
            <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {stats?.upvotes ?? stats?.reactions ?? 0}
          </button>
          <button className="flex items-center hover:text-purple-500 transition-colors" title="Collects">
            <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1" /> {stats?.collects ?? 0}
          </button>
        </div>
        <Link href={detailUrl} legacyBehavior>
          <a className="text-kintask-blue dark:text-sky-400 hover:underline font-medium text-xs sm:text-sm">
            View Details
          </a>
        </Link>
      </div>
    </article>
  );
};

export default PublicationCard;