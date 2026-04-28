import { getFromArchiveList } from "~/shared/services/sharedService";
import { postToArchive, patchToArchive, deleteFromArchive } from "~/shared/services/sharedService";

import type { HistoryEntryRecord } from "~/features/history/types/historyTypes";

export type HistoryEntryCreateRequest = {
  year: number;
  language: string;
  title?: string | null;
  content: string;
};

export type HistoryEntryUpdateRequest = Partial<HistoryEntryCreateRequest>;

const ENDPOINT = "/history";

export async function getHistoryEntries(): Promise<HistoryEntryRecord[]> {
  return getFromArchiveList<HistoryEntryRecord>(ENDPOINT);
}

export async function createHistoryEntry(
  request: HistoryEntryCreateRequest
): Promise<HistoryEntryRecord> {
  return postToArchive<HistoryEntryRecord>(ENDPOINT, request);
}

export async function updateHistoryEntry(
  id_url: string,
  request: HistoryEntryUpdateRequest
): Promise<HistoryEntryRecord> {
  const id = extractIdFromUrl(id_url);
  return patchToArchive<HistoryEntryRecord>(`${ENDPOINT}/${id}`, request);
}

export async function deleteHistoryEntry(id_url: string): Promise<void> {
  const id = extractIdFromUrl(id_url);
  return deleteFromArchive(`${ENDPOINT}/${id}`);
}

function extractIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}