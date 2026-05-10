import type { PaginationRequest } from "~/features/archive/types/paginationTypes";
import { createApiClient } from "./apiClient";

const ARCHIVE_PATH: string = "/api/v1/archive";

function ensureTrailingSlash(url: string): string {
  const [path, ...rest] = url.split(/(?=[?#])/);
  return path.endsWith("/") ? url : `${path}/${rest.join("")}`;
}

function normalizeRequestUrl(url: string): string {
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    try {
      const parsedUrl = new URL(trimmedUrl);
      return ensureTrailingSlash(`${parsedUrl.pathname}${parsedUrl.search}`);
    } catch {
      return ensureTrailingSlash(trimmedUrl);
    }
  }
  return ensureTrailingSlash(trimmedUrl);
}

function archivePath(url: string): string {
  return ensureTrailingSlash(`${ARCHIVE_PATH}${url}`);
}

export async function getByUrl<T>(url: string, lang?: string): Promise<T> {
  const apiClient = createApiClient(lang);
  const data = await apiClient.get<T>(normalizeRequestUrl(url));
  return data.data;
}

export async function getFromArchive<T>(url: string, lang?: string): Promise<T> {
  const apiClient = createApiClient(lang);
  const data = await apiClient.get<T>(archivePath(url));
  return data.data;
}

export async function postToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.post<T>(archivePath(url), data);
  return response.data;
}

export async function patchToArchive<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.patch<T>(archivePath(url), data);
  return response.data;
}

export async function patchByUrl<T>(url: string, data: unknown): Promise<T> {
  const apiClient = createApiClient();
  const response = await apiClient.patch<T>(normalizeRequestUrl(url), data);
  return response.data;
}

export async function deleteFromArchive(url: string): Promise<void> {
  const apiClient = createApiClient();
  await apiClient.delete(archivePath(url));
}

export async function getFromArchiveList<T, CursorT = number>(
  url: string,
  params?: PaginationRequest<CursorT>
): Promise<T[]> {
  const apiClient = createApiClient();
  const data = await apiClient.get<T[]>(archivePath(url), { params });
  return data.data;
}
