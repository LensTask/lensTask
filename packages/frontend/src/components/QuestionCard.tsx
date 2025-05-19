// src/components/QuestionCard.tsx
import Link from 'next/link';
import { ChatBubbleOvalLeftEllipsisIcon, ArrowUpCircleIcon } from '@heroicons/react/24/outline';

// Define a type that closely matches the example publication structure you provided
// This helps with type safety within this component.
export interface KintaskPublication {
  id: string;
  __typename: 'Post' | 'Comment' | 'Mirror' | 'Quote' | string;
  author: {
    __typename: 'Account';
    address: string;
    username?: {
      __typename: 'Username';
      fullHandle: string;
      localName: string;
      namespace: string;
    } | null;
    metadata?: {
      __typename: 'ProfileMetadata';
      picture?: {
        __typename: 'ImageSet';
        optimized?: { uri: string } | null;
        raw?: { uri: string } | null;
      } | null;
    } | null;
  };
  metadata?: {
    __typename: 'ArticleMetadata' | 'TextOnlyMetadataV3' | string;
    id?: string;
    title?: string | null;
    content?: string | null;
    tags?: string[] | null;
    attributes?: Array<{ traitType?: string | null; value?: string | null }> | null;
    attachments?: Array<any> | null;
    contentWarning?: string | null;
  } | null;
  stats?: {
    __typename: 'PostStats' | string;
    comments: number;
    collects: number;
    upvotes?: number;
    mirrors?: number;
    quotes?: number;
  } | null;
  timestamp: string;
  app?: { appId?: string } | null;
}

// Helper to get a displayable image URL
const getProfilePictureUrl = (author: KintaskPublication['author']): string => {
  const pictureSet = author.metadata?.picture;
  if (pictureSet) {
    return pictureSet.optimized?.uri || pictureSet.raw?.uri || '/default-avatar.png';
  }
  return '/default-avatar.png';
};

// Helper to get a displayable handle
const getDisplayHandle = (author: KintaskPublication['author']): string => {
  return (
    author.username?.localName ||
    `Account: ${author.address.substring(0, 6)}...${author.address.substring(
      author.address.length - 4
    )}`
  );
};

interface QuestionCardProps {
  pub: KintaskPublication;
  isAccepted?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ pub, isAccepted = false }) => {
  // Ensure we only try to render Post-like structures that have an author and metadata
  if (!pub.author || !pub.metadata || (pub.__typename !== 'Post' && pub.__typename !== 'Comment')) {
    return null;
  }

  const profile = pub.author;
  const metadata = pub.metadata;
  const stats = pub.stats;

  const profilePictureUrl = getProfilePictureUrl(profile);
  const displayHandle = getDisplayHandle(profile);

  // Extract title and content based on metadata type
  let title = 'Untitled Question';
  let contentSnippet = metadata?.content || 'No content preview available.';

  let questionTitle = 'test';
  try {
    questionTitle = JSON.parse(metadata?.content!).title;
  } catch {
    questionTitle = 'test';
  }

  if (metadata) {
    switch (metadata.__typename) {
      case 'ArticleMetadataV3':
      case 'ArticleMetadata':
        title =
          questionTitle ||
          (metadata.content
            ? metadata.content.substring(0, 70) + (metadata.content.length > 70 ? '...' : '')
            : 'Untitled Article');
        contentSnippet = metadata.content || 'No content available.';
        break;
      case 'TextOnlyMetadataV3':
      case 'TextOnlyMetadata':
        title =
          questionTitle === 'test'
            ? metadata.content.substring(0, 70) +
              (metadata.content.length > 70 ? '...' : '')
            : questionTitle;
        break;
      default:
        title =
          metadata.content
            ? metadata.content.substring(0, 70) + (metadata.content.length > 70 ? '...' : '')
            : metadata.title || 'Lens Publication';
        break;
    }
  }

  if (title.length > 70) title = title.substring(0, 67) + '...';
  if (contentSnippet.length > 150) contentSnippet = contentSnippet.substring(0, 147) + '...';

  const questionDetailUrl = `/question/${pub.id}`;

  return (
    <div
      className={`
        bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 hover:shadow-2xl transition-shadow duration-300
        border border-gray-200 dark:border-gray-700
        ${isAccepted ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
      `}
    >
      {isAccepted && (
        <span className="inline-block mb-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded">
          Accepted Answer 🎉
        </span>
      )}

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
        <div className="flex-1 min-w-0">
          <Link href={questionDetailUrl} legacyBehavior>
            <a
              className="block text-base sm:text-lg font-semibold text-sky-600 dark:text-sky-400 hover:underline truncate"
              title={title}
            >
              {title}
            </a>
          </Link>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
            Asked by{' '}
            <Link href={`/profile/lens/${displayHandle.replace('/', ':')}`} legacyBehavior>
              <a className="font-medium hover:underline">{displayHandle}</a>
            </Link>{' '}
            on{' '}
            {new Date(pub.timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3 mt-auto">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="flex items-center" title="Upvotes/Reactions">
            <ArrowUpCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-green-500" />{' '}
            {stats?.upvotes || stats?.collects || 0}
          </span>
          <span className="flex items-center" title="Comments/Answers">
            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-blue-500" />{' '}
            {stats?.comments || 0}
          </span>
        </div>
        <Link href={questionDetailUrl} legacyBehavior>
          <a className="text-kintask-blue dark:text-sky-400 hover:underline font-medium text-xs sm:text-sm">
            View Task & Answers
          </a>
        </Link>
      </div>
    </div>
  );
};

export default QuestionCard;
