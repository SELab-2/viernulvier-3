import axios, { type AxiosInstance } from "axios";

import { createApiClient } from "~/shared/services/apiClient";

import { AUTH_API_PATH } from "../auth.constants";
import type {
  IAuthUser,
  IAuthUserResponse,
  ILoginRequest,
  ILoginResponse,
} from "../auth.types";
import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  hasStoredRefreshToken,
  storeAuthTokens,
} from "./tokenStorage";
import { refreshAccessToken } from "./tokenRefresh";

function mapAuthUser(response: IAuthUserResponse): IAuthUser {
  return {
    id: response.id,
    username: response.username,
    isSuperUser: response.super_user,
    roles: response.roles,
    permissions: response.permissions,
    createdAt: response.created_at,
    lastLoginAt: response.last_login_at,
  };
}

function isUnauthorizedError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

function clearSessionForUnauthorizedError(error: unknown): boolean {
  if (!isUnauthorizedError(error)) {
    return false;
  }

  clearStoredAuthTokens();
  return true;
}

export async function getCurrentUser(apiClient: AxiosInstance = createApiClient()) {
  const response = await apiClient.get<IAuthUserResponse>(`${AUTH_API_PATH}/users/me`);
  return mapAuthUser(response.data);
}

export async function login(
  request: ILoginRequest,
  apiClient: AxiosInstance = createApiClient()
): Promise<IAuthUser> {
  const response = await apiClient.post<ILoginResponse>(
    `${AUTH_API_PATH}/login`,
    request
  );

  storeAuthTokens(response.data);

  try {
    return await getCurrentUser(apiClient);
  } catch (error) {
    clearSessionForUnauthorizedError(error);
    throw error;
  }
}

export async function restoreSession(
  apiClient: AxiosInstance = createApiClient()
): Promise<IAuthUser | null> {
  try {
    if (!getStoredAccessToken()) {
      if (!hasStoredRefreshToken()) {
        return null;
      }

      await refreshAccessToken();
    }

    return await getCurrentUser(apiClient);
  } catch (error) {
    if (clearSessionForUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}

export async function refreshSession(
  apiClient: AxiosInstance = createApiClient()
): Promise<IAuthUser | null> {
  if (!hasStoredRefreshToken()) {
    clearStoredAuthTokens();
    return null;
  }

  try {
    await refreshAccessToken();
    return await getCurrentUser(apiClient);
  } catch (error) {
    if (clearSessionForUnauthorizedError(error)) {
      return null;
    }

    throw error;
  }
}

export function logout(): void {
  clearStoredAuthTokens();
}

export async function refreshToken(apiClient?: AxiosInstance): Promise<string> {
  return refreshAccessToken(apiClient);
}
