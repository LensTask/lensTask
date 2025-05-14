// components/ProfileView.tsx
import React from 'react';
// No specific Lens SDK type import needed here if we define props based on your example
import { normalizeImageUrl } from '@/lib/utils'; // Assuming you have this utility

// --- Define a type based on YOUR provided profile structure ---
interface KintaskProfile {
  address: string;
  metadata?: {
    name?: string | null; // Display name
    bio?: string | null;
    picture?: string | null; // Direct URL for profile picture
    thumbnail?: string | null; // Direct URL for thumbnail
    coverPicture?: string | null; // Assuming cover might also be a direct URL if present
  } | null;
  username?: {
    __typename: 'Username';
    id: string;
    value: string; // This is often the full namespaced handle like "lens/dev2_04"
    localName: string; // e.g., "dev2_04"
    namespace?: string; // e.g., "lens"
    // ... other username fields if present
  } | null;
  id?: string; // Often the Profile ID (different from address or username.id)
  stats?: { // Add stats if they are actually part of your fetched profile object
    posts?: number;
    followers?: number;
    following?: number;
  } | null;
  __typename: "Account" | string; // Or "Profile" depending on your SDK version
}

interface ProfileViewProps {
  profile: KintaskProfile; // Use the new interface
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile }) => {
  // Use thumbnail as a smaller version, fallback to main picture or default
  const profilePictureUrl = normalizeImageUrl(profile.metadata?.thumbnail || profile.metadata?.picture);
  // Assuming cover picture might also be a direct URL if it exists in your actual data
  const coverPictureUrl = normalizeImageUrl(profile.metadata?.coverPicture);

  const displayName = profile.metadata?.name || profile.username?.localName || profile.username?.value;
  const fullHandle = profile.username?.value; // e.g., "lens/dev2_04"
  // For links, often the full handle or a part of it is used.
  // If your profile routes are like /profile/dev2_04 (using localName)
  const profileLinkHandle = profile.username?.localName || profile.address;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden border dark:border-slate-700">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-slate-200 dark:bg-slate-700 relative">
        {coverPictureUrl ? (
          <img
            src={coverPictureUrl}
            alt={`${displayName}'s cover picture`}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-sky-400 to-blue-500 dark:from-sky-600 dark:to-blue-700"></div>
        )}
      </div>

      {/* Profile Header */}
      <div className="p-6 relative">
        <div className="flex flex-col items-center sm:flex-row sm:items-end sm:space-x-5 -mt-20 sm:-mt-24">
          {/* Profile Picture */}
          <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700 shadow-lg flex items-center justify-center">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={displayName || 'Profile picture'}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
              />
            ) : (
              <span className="text-slate-500 dark:text-slate-400 text-4xl md:text-5xl font-semibold">
                {(displayName || 'P').substring(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-grow min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate" title={displayName || undefined}>
              {displayName || 'Unnamed Profile'}
            </h1>
            {fullHandle && (
              <p className="text-slate-500 dark:text-slate-400 text-sm truncate" title={`@${fullHandle}`}>
                @{fullHandle}
              </p>
            )}
            {/* Displaying address as a fallback or additional info if no handle */}
            {!fullHandle && profile.address && (
                 <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate" title={profile.address}>
                    Address: {profile.address}
                 </p>
            )}
            {profile.id && ( // If Profile ID is available and different from username ID
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Profile ID: {profile.id}
                </p>
            )}
          </div>
          {/* Optional: Follow Button / Edit Profile Button */}
        </div>

        {/* Bio */}
        {profile.metadata?.bio && (
          <p className="text-slate-700 dark:text-slate-300 mt-5 text-sm whitespace-pre-line break-words leading-relaxed text-center sm:text-left">
            {profile.metadata.bio}
          </p>
        )}

        {/* Stats - Check if your `profile` object actually contains `stats` */}
        {profile.stats && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-around text-center gap-y-4">
            <div>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{profile.stats?.posts ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Posts</p>
            </div>
            <div>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{profile.stats?.followers ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Followers</p>
            </div>
            <div>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{profile.stats?.following ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Following</p>
            </div>
            </div>
        )}
        {!profile.stats && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 text-center">
                 <p className="text-xs text-slate-400 dark:text-slate-500 italic">(Profile stats not available)</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;