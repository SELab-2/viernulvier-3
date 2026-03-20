import { useCallback, useEffect, useState } from "react";

export type UseAsyncReturn<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
};

export function useAsyncFetch<T>(asyncFn: () => Promise<T>): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Refresh function used to fetch and refetch data if needed
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    asyncFn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [asyncFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
