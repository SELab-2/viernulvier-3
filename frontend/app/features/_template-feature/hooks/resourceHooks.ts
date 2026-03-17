import { useCallback, useEffect, useState } from "react";
import { getResourceById, getResourceList } from "../services/resourceService";
import type { IResource } from "../resource.types";

export function useGetResources(limit: number) {
  const [data, setData] = useState<IResource[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Refresh function used to fetch and refetch data if needed
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    getResourceList(limit)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useGetResourceById(id: number) {
  const [data, setData] = useState<IResource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Refresh function used to fetch and refetch data if needed
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    getResourceById(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
