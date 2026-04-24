'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

/**
 * Stale-while-revalidate fetch hook.
 *
 * `loading` is true ONLY until the first successful fetch (or until the
 * path changes to a new resource). On manual refetch(), existing data
 * stays visible and `loading` does NOT flip back to true — otherwise
 * any parent that renders `loading ? <Skeleton /> : <content />` would
 * unmount its whole subtree mid-refetch, losing local state like the
 * budget line-item form.
 *
 * Callers that want to show a spinner during background revalidation
 * can read `refetching`.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const mountedRef = useRef(true);
  const pathRef = useRef<string | null>(path);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    // Path change = new resource → reset to skeleton so we don't show
    // the previous resource's data under the new URL. Refetch of the
    // same path = stale-while-revalidate, keep the UI mounted.
    const pathChanged = pathRef.current !== path;
    pathRef.current = path;
    if (pathChanged) {
      setData(null);
      setLoading(true);
    } else {
      setRefetching(true);
    }

    let cancelled = false;
    setError(null);

    api.get<T>(path)
      .then((result) => {
        if (!cancelled && mountedRef.current) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
          setRefetching(false);
        }
      });

    return () => { cancelled = true; };
  }, [path, fetchCount]);

  const refetch = () => setFetchCount((c) => c + 1);

  return { data, loading, refetching, error, refetch };
}
