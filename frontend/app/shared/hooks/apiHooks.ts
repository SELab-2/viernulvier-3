import { getByUrl } from "../services/sharedService";
import { useAsyncFetch, type UseAsyncReturn } from "./useAsyncFetch";

export function useGetByUrl<R>(url: string): UseAsyncReturn<R> {
  return useAsyncFetch<R>(() => getByUrl(url));
}
