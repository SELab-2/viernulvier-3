import { API_BASE_URL } from "~/shared/constants/api.const";
import { apiClient } from "~/shared/services/apiClient";
import type {
  ICreateResource,
  IResource,
  IUpdateResource,
} from "../resource.types";

const ENDPOINT = "/resource";

export async function getResourceList(limit: number): Promise<IResource[]> {
  const data = await apiClient.get<IResource[]>(`${API_BASE_URL}/${ENDPOINT}`, {
    params: { limit },
  });
  return data.data;
}

export async function getResourceById(id: number): Promise<IResource> {
  const data = await apiClient.get<IResource>(
    `${API_BASE_URL}/${ENDPOINT}/${id}`
  );
  return data.data;
}

export async function createResource(data: ICreateResource) {
  apiClient.post<IResource>(JSON.stringify(data));
}

export async function editResource(id: number, data: IUpdateResource) {
  apiClient.patch(`${API_BASE_URL}/${ENDPOINT}/${id}`, JSON.stringify(data));
}

export async function deleteResource(id: number) {
  apiClient.delete(`${API_BASE_URL}/${ENDPOINT}/${id}`);
}
