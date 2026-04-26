import { ArchiveSortOrder } from "../components/ProductionTimeline";

export const archiveSortOrderToBackendSortOrder: Record<ArchiveSortOrder, string> = {
  [ArchiveSortOrder.NewestFirst]: "Descending",
  [ArchiveSortOrder.OldestFirst]: "Ascending",
} as const;
