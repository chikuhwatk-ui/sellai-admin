'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
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
        }
      });

    return () => { cancelled = true; };
  }, [path, fetchCount]);

  const refetch = () => setFetchCount((c) => c + 1);

  return { data, loading, error, refetch };
}
