import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'table' | 'cards' | 'profile' }> = ({
  rows = 5,
  type = 'table',
}) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl p-5" />
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 md:col-span-2 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-sm w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
      ))}
    </div>
  );
};
