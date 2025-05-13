// components/PublicationCard.tsx
import React from 'react';
import { PostFragment } from '@lens-protocol/client'; // Assuming you narrow down type or use a broader one
import { normalizeImageUrl } from '@/lib/utils';

interface PublicationCardProps {
  // The PublicationFragment is broad; ideally, you'd work with PostFragment for posts
  publication: PostFragment; // Or a more generic Publication type if handling comments/mirrors too
}

const PublicationCard: React.FC<PublicationCardProps> = ({ publication }) => {
  // --- Content Rendering Logic ---
  let title: string | undefined;
  let content: string | undefined;
  let mainImage: string | undefined;

  if (publication.metadata) {
    switch (publication.metadata.__typename) {
      case 'ArticleMetadataV3':
        title = publication.metadata.title;
        content = publication.metadata.content.substring(0, 300) + (publication.metadata.content.length > 300 ? '...' : ''); // Truncate for card
        break;
      case 'TextOnlyMetadataV3':
        content = publication.metadata.content.substring(0, 300) + (publication.metadata.content.length > 300 ? '...' : '');
        break;
      case 'ImageMetadataV3':
        title = publication.metadata.title;
        content = publication.metadata.content?.substring(0, 150) + (publication.metadata.content && publication.metadata.content.length > 150 ? '...' : '');
        if (publication.metadata.asset.image?.optimized?.uri) {
            mainImage = normalizeImageUrl(publication.metadata.asset.image.optimized.uri);
        }
        break;
      // TODO: Add cases for VideoMetadataV3, AudioMetadataV3, LinkMetadataV3, etc.
      default:
        content = publication.metadata.content.substring(0, 300) + (publication.metadata.content.length > 300 ? '...' : '');
    }
  } else {
    content = "Metadata not available for this publication.";
  }

  const profilePic = normalizeImageUrl(
    publication.by?.metadata?.picture?.__typename === 'ImageSet' ? publication.by.metadata.picture.optimized?.uri :
    publication.by?.metadata?.picture?.__typename === 'NftImage' ? publication.by.metadata.picture.uri : undefined
  );


  return (
    <article className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 border dark:border-gray-700">
      <div className="flex items-start space-x-3 mb-3">
        {profilePic && (
            <img src={profilePic} alt={publication.by.handle?.fullHandle} className="w-10 h-10 rounded-full object-cover" />
        )}
        {!profilePic && (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500">
                {publication.by.handle?.fullHandle.substring(0,1).toUpperCase()}
            </div>
        )}
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{publication.by.metadata?.displayName || publication.by.handle?.fullHandle}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            @{publication.by.handle?.fullHandle} · {new Date(publication.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {title && <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-100 break-words">{title}</h3>}
      {mainImage && <img src={mainImage} alt={title || 'Publication image'} className="rounded-md mb-2 max-h-96 w-full object-contain" />}
      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line break-words">{content}</p>

      {/* TODO: Add Publication Stats (comments, mirrors, reactions, collects) */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span>{publication.stats?.comments ?? 0} Comments</span>
        <span>{publication.stats?.mirrors ?? 0} Mirrors</span>
        <span>{publication.stats?.upvotes ?? 0} Upvotes</span> {/* upvotes: reactions(request: {type: UPVOTE}) */}
        <span>{publication.stats?.collects ?? 0} Collects</span>
      </div>
    </article>
  );
};

export default PublicationCard;