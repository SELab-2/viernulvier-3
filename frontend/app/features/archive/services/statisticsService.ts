import { getFromArchive } from "~/shared/services/sharedService";
import type { ArchiveStatistics } from "../types/statisticsTypes";

const ENDPOINT = "/statistics";

export async function getArchiveStatistics(): Promise<ArchiveStatistics> {
  return getFromArchive<ArchiveStatistics>(ENDPOINT);
}
