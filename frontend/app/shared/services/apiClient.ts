import axios, { type InternalAxiosRequestConfig } from "axios";

import { refreshAccessToken } from "~/features/auth/services/tokenRefresh";
import {
  getStoredAccessToken,
  hasStoredRefreshToken,
} from "~/features/auth/services/tokenStorage";

import { getEnv } from "../utils/env";
import i18n from "~/i18n";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const UNAUTHORIZED_RETRY_EXCLUDED_PATHS = ["/auth/login", "/auth/refresh"] as const;

function shouldRetryUnauthorized(request: RetryableRequestConfig | undefined): boolean {
  if (!request || request._retry || !request.url || !hasStoredRefreshToken()) {
    return false;
  }

  return !UNAUTHORIZED_RETRY_EXCLUDED_PATHS.some(
    (path) => request.url === path || request.url?.endsWith(path)
  );
}

let activeRefreshRequest: Promise<string> | null = null;

export function createApiClient() {
  const { API_BASE_URL } = getEnv();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  apiClient.interceptors.request.use((config) => {
    const accessToken = getStoredAccessToken();
    const lang = i18n.language;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (lang) {
      config.headers["Accept-Language"] = lang;
      config.headers["Preferred-Language"] = lang;
    }

    return config;
  });

  apiClient.interceptors.response.use(undefined, async (error) => {
    const request = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !request ||
      !shouldRetryUnauthorized(request)
    ) {
      throw error;
    }

    request._retry = true;

    const refreshRequest = activeRefreshRequest ?? refreshAccessToken();
    activeRefreshRequest = refreshRequest;

    try {
      await refreshRequest;
      return apiClient(request);
    } finally {
      if (activeRefreshRequest === refreshRequest) {
        activeRefreshRequest = null;
      }
    }
  });

  return apiClient;
}
