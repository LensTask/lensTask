// components/ProfileView.tsx
import React from 'react';
import { ProfileFragment } from '@lens-protocol/client';
import { normalizeImageUrl } from '@/lib/utils';

interface ProfileViewProps {
  profile: ProfileFragment;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  const coverPictureUrl = normalizeImageUrl(
    profile.metadata?.coverPicture?.__typename === 'ImageSet'
      ? profile.metadata.coverPicture.optimized?.uri
      : undefined
  );
  const profilePictureUrl = normalizeImageUrl(
    profile.metadata?.picture?.__typename === 'ImageSet'
      ? profile.metadata.picture.optimized?.uri
      : profile.metadata?.picture?.__typename === 'NftImage'
        ? profile.metadata.picture.uri
        : undefined
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover Image */}
      <div className="bg-gray-200 dark:bg-gray-700 h-48 md:h-64 rounded-t-lg overflow-hidden relative">
        {coverPictureUrl && (
          <img src={coverPictureUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
        {!coverPictureUrl && <div className="w-full h-full bg-gray-300 dark:bg-gray-600"></div>}
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-b-lg p-6 relative border border-t-0 dark:border-gray-700">
        <div className="flex flex-col items-center sm:flex-row sm:items-end -mt-20 sm:-mt-24">
          {/* Profile Picture */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt={profile.metadata?.displayName || profile.handle?.fullHandle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-4xl font-semibold">
                {profile.handle?.fullHandle.substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white break-words">
              {profile.metadata?.displayName || profile.handle?.fullHandle}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              @{profile.handle?.fullHandle} <span className="mx-1">·</span> {profile.id}
            </p>
            {profile.metadata?.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm whitespace-pre-line break-words">
                {profile.metadata.bio}
              </p>
            )}
            {/* Optional: Follow Button / Actions */}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-around text-center">
          <div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{profile.stats?.posts ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posts</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{profile.stats?.followers ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Followers</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{profile.stats?.following ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Following</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;