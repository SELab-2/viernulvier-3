import { useState } from "react";
import { getResourceById, getResourceList } from "../services/resourceService";
import type { IResource } from "../resource.types";

export function useGetResources(limit: number) {
  const [data, setData] = useState<IResource[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  getResourceList(20)
    .then((data) => setData(data))
    .catch(setError)
    .finally(() => setLoading(false));

  return { data, loading, error };
}

export function useGetResourceById(id: number) {
  const [data, setData] = useState<IResource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  getResourceById(id)
    .then((data) => setData(data))
    .catch(setError)
    .finally(() => setLoading(false));

  return { data, loading, error };
}
