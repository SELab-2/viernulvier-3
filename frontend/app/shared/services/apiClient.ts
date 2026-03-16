import axios from "axios";
import { API_BASE_URL } from "../constants/api.const";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 1000,
  headers: { "Content-Type": "application/json" },
});

export async function getByUrl<T>(url: string): Promise<T> {
  const data = await apiClient.get<T>(url);
  return data.data;
}
