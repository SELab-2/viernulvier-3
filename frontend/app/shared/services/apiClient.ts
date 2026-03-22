import axios from "axios";
import { getEnv } from "../utils/env";
import { refreshToken } from "~/features/auth";

const ARCHIVE_PATH: string = '/api/v1/archive';

export function createApiClient() {
  const { API_BASE_URL } = getEnv();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to always use current token from localStorage
  apiClient.interceptors.request.use((config) => {
    const access_token = localStorage.getItem("access_token");
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(undefined, async (error) => {
    const request = error.config;
    if (
      error.response?.status === 401 &&
      !request._retry &&
      !request.url?.includes("/auth/refresh")
    ) {
      request._retry = true;
      const refresh_token = localStorage.getItem("refresh_token");
      if (refresh_token) {
        await refreshToken(apiClient);
        return apiClient(request); // Retry original request
      }
    }

    throw error;
  });

  return apiClient;
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

export interface PaginationParams {
  limit?: number;
  cursor?: string;
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
