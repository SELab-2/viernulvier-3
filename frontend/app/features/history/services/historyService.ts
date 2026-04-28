import { getFromArchiveList } from "~/shared/services/sharedService";

import type { HistoryEntryRecord } from "~/features/history/types/historyTypes";

const ENDPOINT = "/history";

export async function getHistoryEntries(): Promise<HistoryEntryRecord[]> {
  return getFromArchiveList<HistoryEntryRecord>(ENDPOINT);
}