import { createApiClient } from "~/shared/services/apiClient";
import type { IAccessTokenResponse, ILoginRequest, ILoginResponse } from "../auth.types";

export async function login(request: ILoginRequest) {
  const apiClient = createApiClient();
  const response = await apiClient.post<ILoginResponse>(`/auth/login`, request);

  const { access_token, refresh_token } = response.data;

  apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  localStorage.setItem("access_token", access_token);
  localStorage.setItem("refresh_token", refresh_token);
}

export async function refreshToken() {
  const apiClient = createApiClient();
  const refresh_token = localStorage.getItem("refresh_token");
  if (refresh_token) {
    const response = await apiClient.post<IAccessTokenResponse>(`/auth/refresh`, {
      refresh_token,
    });

    const { access_token } = response.data;
    localStorage.setItem("access_token", access_token);
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  }
}
