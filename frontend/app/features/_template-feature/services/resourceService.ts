import { apiClient } from "~/shared/services/apiClient";
import type { ICreateResource, IResource, IUpdateResource } from "../resource.types";

const ENDPOINT = "/resource";

export async function getResourceList(limit?: number): Promise<IResource[]> {
  const response = await apiClient.get<IResource[]>(`${ENDPOINT}`, {
    params: { limit },
  });
  return response.data;
}

export async function getResourceById(id: number): Promise<IResource> {
  const response = await apiClient.get<IResource>(`${ENDPOINT}/${id}`);
  return response.data;
}

export async function createResource(request: ICreateResource): Promise<IResource> {
  const response = await apiClient.post<IResource>(`${ENDPOINT}`, request);
  return response.data;
}

export async function editResource(id: number, request: IUpdateResource): Promise<IResource> {
  const response = await apiClient.patch<IResource>(`${ENDPOINT}/${id}`, request);
  return response.data;
}

export async function deleteResource(id: number) {
  const response = await apiClient.delete<IResource>(`${ENDPOINT}/${id}`);
  return response.data;
}
