import axios from "axios";
import { getEnv } from "../utils/env";

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
  return apiClient;
}

export async function getByUrl<T>(url: string): Promise<T> {
  const apiClient = createApiClient();
  const data = await apiClient.get<T>(url);
  return data.data;
}
