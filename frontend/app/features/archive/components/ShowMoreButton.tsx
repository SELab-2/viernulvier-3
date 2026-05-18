import { useTranslation } from "react-i18next";
import type { ProductionList } from "../types/productionTypes";
import { getProductionsPaginated } from "../services/productionService";
import type { SortOrderEnum } from "~/shared/components/SortOrderSelection";
import { frontendSortOrderToBackendSortOrder } from "~/shared/utils/orderMapping";

export function ShowMoreButton({
  productionList,
  setProductionList,
  sortOrder,
  filters,
}: {
  productionList: ProductionList;
  setProductionList: React.Dispatch<React.SetStateAction<ProductionList | null>>;
  sortOrder: SortOrderEnum;
  filters: {
    production_name?: string;
    earliest_at?: string;
    latest_at?: string;
    tag_ids?: string[];
    series_ids?: string[];
    artists?: string[];
  };
}) {
  const { t } = useTranslation();

  async function onClick() {
    const next_productions = await getProductionsPaginated({
      cursor: productionList.pagination.next_cursor,
      sort_order: frontendSortOrderToBackendSortOrder[sortOrder],
      ...filters,
    });

    setProductionList({
      productions: [...productionList.productions, ...next_productions.productions],
      pagination: next_productions.pagination,
    });
  }
  return (
    <div className="mt-15 w-full text-center">
      <button
        onClick={onClick}
        className="bg-archive-accent/90 hover:bg-archive-accent cursor-pointer rounded-md px-5 py-2 font-sans text-sm font-bold tracking-[0.2em] uppercase transition-all"
      >
        {t("archive.show_more")}
      </button>
    </div>
  );
}
