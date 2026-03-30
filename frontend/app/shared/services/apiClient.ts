import axios, { type InternalAxiosRequestConfig } from "axios";

import { refreshAccessToken } from "~/features/auth/services/tokenRefresh";
import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  hasStoredRefreshToken,
} from "~/features/auth/services/tokenStorage";

import { getEnv } from "../utils/env";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let activeRefreshRequest: Promise<string> | null = null;

export function createApiClient() {
  const { API_URL } = getEnv();

  const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  apiClient.interceptors.request.use((config) => {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  });

  apiClient.interceptors.response.use(undefined, async (error) => {
    const request = error.config as RetryableRequestConfig | undefined;

    if (
      !request ||
      error.response?.status !== 401 ||
      request._retry ||
      request.url?.includes("/auth/refresh") ||
      !hasStoredRefreshToken()
    ) {
      throw error;
    }

    request._retry = true;

    const refreshRequest = activeRefreshRequest ?? refreshAccessToken();
    activeRefreshRequest = refreshRequest;

    try {
      await refreshRequest;
      return apiClient(request);
    } catch (refreshError) {
      clearStoredAuthTokens();
      throw refreshError;
    } finally {
      if (activeRefreshRequest === refreshRequest) {
        activeRefreshRequest = null;
      }
    }
  });

  return apiClient;
}
