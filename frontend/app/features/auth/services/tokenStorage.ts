import { AUTH_STORAGE_KEYS } from "../auth.constants";
import type { IStoredAuthTokens, ILoginResponse } from "../auth.types";

function hasLocalStorage() {
  return typeof localStorage !== "undefined";
}

export function getStoredAccessToken(): string | null {
  if (!hasLocalStorage()) {
    return null;
  }

  return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken(): string | null {
  if (!hasLocalStorage()) {
    return null;
  }

  return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
}

export function getStoredAuthTokens(): IStoredAuthTokens {
  return {
    accessToken: getStoredAccessToken(),
    refreshToken: getStoredRefreshToken(),
  };
}

export function hasStoredRefreshToken(): boolean {
  return Boolean(getStoredRefreshToken());
}

export function hasStoredSession(): boolean {
  const { accessToken, refreshToken } = getStoredAuthTokens();
  return Boolean(accessToken || refreshToken);
}

export function storeAuthTokens(tokens: ILoginResponse): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, tokens.access_token);
  localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, tokens.refresh_token);
}

export function updateStoredAccessToken(accessToken: string): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
}

export function clearStoredAuthTokens(): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
}
