import { createApiClient } from "./apiClient";

const ARCHIVE_PATH: string = "/api/v1/archive";

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export async function getByUrl<T>(url: string): Promise<T> {
  const apiClient = createApiClient();
  const data = await apiClient.get<T>(url);
  return data.data;
}

export async function getFromArchive<T>(url: string): Promise<T> {
  const apiClient = createApiClient();
  const data = await apiClient.get<T>(`${ARCHIVE_PATH}${url}`);
  return data.data;
}

export async function postToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.post<T>(`${ARCHIVE_PATH}${url}`, data);
  return response.data;
}

export async function patchToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.patch<T>(`${ARCHIVE_PATH}${url}`, data);
  return response.data;
}

export async function deleteFromArchive(url: string): Promise<void> {
  const apiClient = createApiClient();
  await apiClient.delete(`${ARCHIVE_PATH}${url}`);
}

export async function getFromArchiveList<T>(
  url: string,
  params?: PaginationParams
): Promise<T[]> {
  const apiClient = createApiClient();
  const data = await apiClient.get<T[]>(`${ARCHIVE_PATH}${url}`, {
    params,
  });
  return data.data;
}
