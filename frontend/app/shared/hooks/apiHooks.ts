import { useState } from "react";
import { getByUrl } from "../services/apiClient";

export function useGetByUrl<R>(url: string) {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  getByUrl<R>(url)
    .then((data) => setData(data))
    .catch(setError)
    .finally(() => setLoading(false));

  return { data, loading, error };
}
