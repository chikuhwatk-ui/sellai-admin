'use client';

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-lg font-semibold text-[#E5E7EB] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#6B7280] mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
