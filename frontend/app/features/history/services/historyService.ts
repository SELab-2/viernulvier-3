import { getFromArchiveList } from "~/shared/services/sharedService";
import {
  postToArchive,
  patchToArchive,
  deleteFromArchive,
} from "~/shared/services/sharedService";

import type { HistoryEntryRecord } from "~/features/history/types/historyTypes";

export type HistoryEntryCreateRequest = {
  year: number;
  language: string;
  title?: string | null;
  content: string;
};

export type HistoryEntryUpdateRequest = Partial<HistoryEntryCreateRequest>;

const ENDPOINT = "/history";

function buildHistoryEntryPath(year: number, language: string): string {
  return `${ENDPOINT}/${year}/${language}`;
}

export async function getHistoryEntries(): Promise<HistoryEntryRecord[]> {
  return getFromArchiveList<HistoryEntryRecord>(ENDPOINT);
}

export async function createHistoryEntry(
  request: HistoryEntryCreateRequest
): Promise<HistoryEntryRecord> {
  return postToArchive<HistoryEntryRecord>(ENDPOINT, request);
}

export async function updateHistoryEntry(
  year: number,
  language: string,
  request: HistoryEntryUpdateRequest
): Promise<HistoryEntryRecord> {
  return patchToArchive<HistoryEntryRecord>(
    buildHistoryEntryPath(year, language),
    request
  );
}

export async function deleteHistoryEntry(
  year: number,
  language: string
): Promise<void> {
  return deleteFromArchive(buildHistoryEntryPath(year, language));
}
