import { getByUrl } from "../services/apiClient";
import { useAsyncFetch, type UseAsyncReturn } from "./useAsyncFetch";

export function useGetByUrl<R>(url: string): UseAsyncReturn<R> {
  return useAsyncFetch<R>(() => getByUrl(url));
}
