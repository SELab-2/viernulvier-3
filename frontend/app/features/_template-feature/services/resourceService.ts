import { getByUrl, createApiClient } from "~/shared/services/apiClient";
import type { ICreateResource, IResource, IUpdateResource } from "../resource.types";

const ENDPOINT = "/resource";

export async function getResourceList(limit?: number): Promise<IResource[]> {
  // Example with query params - if your API supports pagination
  const url = limit ? `${ENDPOINT}?limit=${limit}` : ENDPOINT;
  return getByUrl<IResource[]>(url);
}

export async function getResourceById(id: number): Promise<IResource> {
  return getByUrl<IResource>(`${ENDPOINT}/${id}`);
}

export async function createResource(request: ICreateResource): Promise<IResource> {
  const apiClient = createApiClient();
  const response = await apiClient.post<IResource>(`${ENDPOINT}`, request);
  return response.data;
}

export async function editResource(id: number, request: IUpdateResource): Promise<IResource> {
  const apiClient = createApiClient();
  const response = await apiClient.patch<IResource>(`${ENDPOINT}/${id}`, request);
  return response.data;
}

export async function deleteResource(id: number): Promise<void> {
  const apiClient = createApiClient();
  await apiClient.delete(`${ENDPOINT}/${id}`);
}
