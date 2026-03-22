import axios from "axios";
import { getEnv } from "../utils/env";
import { refreshToken } from "~/features/auth";

export function createApiClient() {
  const env = getEnv();
  const API_BASE_URL = env?.API_BASE_URL || "https://sel2-3.ugent.be";

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const access_token = localStorage.getItem("access_token");
  if (access_token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  }

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
        const newToken = localStorage.getItem("access_token");
        request.headers["Authorization"] = `Bearer ${newToken}`;
        return apiClient(request);
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
  const data = await apiClient.get<T>(`/api/v1/archive${url}`);
  return data.data;
}

export async function postToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.post<T>(`/api/v1/archive${url}`, data);
  return response.data;
}

export async function patchToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.patch<T>(`/api/v1/archive${url}`, data);
  return response.data;
}

export async function deleteFromArchive(url: string): Promise<void> {
  const apiClient = createApiClient();
  await apiClient.delete(`/api/v1/archive${url}`);
}
