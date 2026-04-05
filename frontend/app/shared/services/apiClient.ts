import axios from "axios";
import { getEnv } from "../utils/env";
import { refreshToken } from "~/features/auth";

export function createApiClient() {
  const { API_BASE_URL } = getEnv();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
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
