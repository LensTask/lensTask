// src/components/QuestionDetailSkeleton.tsx
import React from 'react';

const QuestionDetailSkeleton: React.FC = () => {
  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
      {/* Back Link Skeleton */}
      <div className="h-5 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>

      {/* Main Question Article Skeleton */}
      <article className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border dark:border-slate-700 mb-8">
        {/* Title Skeleton */}
        <div className="h-8 w-3/4 bg-slate-300 dark:bg-slate-600 rounded mb-3"></div>
        <div className="h-6 w-1/2 bg-slate-300 dark:bg-slate-600 rounded mb-4"></div>

        {/* Author Info Skeleton */}
        <div className="flex items-center space-x-2 text-xs mb-4">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>

        {/* Content Lines Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
        </div>
      </article>

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      {/* Answers Section Title Skeleton */}
      <div className="h-7 w-1/2 bg-slate-300 dark:bg-slate-600 rounded mb-6"></div>

      {/* Answer Skeletons */}
      <section className="space-y-6">
        {[...Array(2)].map((_, i) => ( // Display 2 answer skeletons
          <div key={`answer-skel-${i}`} className="border dark:border-slate-700 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-md">
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            </div>
            <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div> {/* Author placeholder */}
            <div className="mt-3 pt-3 border-t dark:border-gray-600">
                <div className="h-8 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div> {/* Button placeholder */}
            </div>
          </div>
        ))}
      </section>

      <hr className="my-8 border-gray-200 dark:border-gray-700"/>

      {/* Answer Composer Skeleton */}
      <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 border dark:border-slate-700">
        <div className="h-6 w-1/3 bg-slate-300 dark:bg-slate-600 rounded mb-4"></div> {/* Title like "Your Answer" */}
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div> {/* Textarea placeholder */}
        <div className="h-10 w-1/4 bg-slate-300 dark:bg-slate-600 rounded ml-auto"></div> {/* Submit button placeholder */}
      </div>
    </main>
  );
};

export default QuestionDetailSkeleton;