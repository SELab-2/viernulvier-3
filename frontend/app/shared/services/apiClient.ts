import axios from "axios";
import { getEnv } from "../utils/env";
import { refreshToken } from "~/features/auth";

export function createApiClient() {
  const { API_BASE_URL } = getEnv();

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
