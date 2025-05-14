// src/components/ProfilePageSkeleton.tsx
import React from 'react';
import QuestionCardSkeleton from './QuestionCardSkeleton'; // Assuming you have this

interface ProfilePageSkeletonProps {
    handle?: string | string[] | undefined;
}

const ProfilePageSkeleton: React.FC<ProfilePageSkeletonProps> = ({ handle }) => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="mb-6 h-6 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div> {/* Back link placeholder */}

      {/* Profile Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-12">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          <div className="flex-1 space-y-3">
            <div className="h-8 w-3/4 bg-slate-300 dark:bg-slate-600 rounded"></div>
            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>

      {/* Publications Section Skeleton */}
      <h2 className="text-2xl md:text-3xl h-8 w-1/2 bg-slate-300 dark:bg-slate-600 rounded mb-6"></h2>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <QuestionCardSkeleton key={`profile-post-skel-${i}`} />
        ))}
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;