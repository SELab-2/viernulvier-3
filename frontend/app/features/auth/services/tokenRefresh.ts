import axios, { type AxiosInstance } from "axios";

import { getEnv } from "~/shared/utils/env";

import { AUTH_API_PATH } from "../auth.constants";
import type { IAccessTokenResponse } from "../auth.types";
import {
  clearStoredAuthTokens,
  getStoredRefreshToken,
  updateStoredAccessToken,
} from "./tokenStorage";

function createRefreshClient() {
  const { API_BASE_URL } = getEnv();

  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function refreshAccessToken(apiClient?: AxiosInstance): Promise<string> {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const client = apiClient ?? createRefreshClient();
    const response = await client.post<IAccessTokenResponse>(
      `${AUTH_API_PATH}/refresh`,
      {
        refresh_token: refreshToken,
      }
    );

    updateStoredAccessToken(response.data.access_token);

    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredAuthTokens();
    }

    throw error;
  }
}
