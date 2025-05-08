const QuestionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 mb-6 animate-pulse">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>

      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full mb-2"></div>
      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-5/6 mb-4"></div>

      <div className="flex space-x-2 mb-4">
        <div className="h-5 w-16 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        <div className="h-5 w-20 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 pt-4">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  );
};

export default QuestionCardSkeleton;