import React from 'react';
import { useTaskFlow } from '../../mock-data/store';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export const ErrorBanner: React.FC = () => {
  const { error, clearError, refreshData, isLoading, simulateErrors, toggleSimulateErrors } = useTaskFlow();

  if (!error) return null;

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-3 mb-2 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-red-900 dark:text-red-200">
            Request Error
          </p>
          <p className="text-[11px] text-red-700 dark:text-red-300 truncate">
            {error}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Retry</span>
        </button>

        <button
          onClick={clearError}
          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
