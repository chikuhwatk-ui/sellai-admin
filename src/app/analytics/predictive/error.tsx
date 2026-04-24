'use client';

import { useEffect } from 'react';

export default function PredictiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Predictive page error:', error);
  }, [error]);

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold text-danger">Predictive Page Error</h2>
      <pre className="bg-panel border border-muted rounded-xl p-4 text-sm text-fg whitespace-pre-wrap overflow-auto max-h-96">
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-accent text-accent-fg rounded-lg text-sm"
      >
        Try again
      </button>
    </div>
  );
}
