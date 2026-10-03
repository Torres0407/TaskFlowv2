import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      </div>

      {/* KPI 2x2 grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-2.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Projects skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-5 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const KanbanSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Board toolbar skeleton */}
      <div className="h-12 w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl" />

      {/* 3 Columns skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(col => (
          <div
            key={col}
            className="p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 min-h-[460px] space-y-3"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200/60 dark:border-zinc-800">
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-6 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>

            <div className="space-y-2.5">
              {[1, 2, 3].map(card => (
                <div
                  key={card}
                  className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5"
                >
                  <div className="flex justify-between">
                    <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-3.5 w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="flex justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="h-3 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
