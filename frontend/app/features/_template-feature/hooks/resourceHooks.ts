import { getResourceById, getResourceList } from "../services/resourceService";
import type { IResource } from "../resource.types";
import { useAsyncFetch, type UseAsyncReturn } from "~/shared/hooks/useAsyncFetch";

export function useGetResourceList(limit: number): UseAsyncReturn<IResource[]> {
  return useAsyncFetch<IResource[]>(() => getResourceList(limit));
}

export function useGetResourceById(id: number): UseAsyncReturn<IResource> {
  return useAsyncFetch<IResource>(() => getResourceById(id));
}
