import { SortOrderEnum } from "~/shared/components/SortOrderSelection";

export const frontendSortOrderToBackendSortOrder: Record<SortOrderEnum, string> = {
  [SortOrderEnum.NewestFirst]: "Descending",
  [SortOrderEnum.OldestFirst]: "Ascending",
} as const;
