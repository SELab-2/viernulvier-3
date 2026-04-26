import { useTranslation } from "react-i18next";
import { ArchiveSortOrder } from "./ProductionTimeline";

export function SortOrderSelection({
  sortOrder,
  setSortOrder,
}: {
  sortOrder: ArchiveSortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<ArchiveSortOrder>>;
}) {
  const { t } = useTranslation();
  const handleChangeSortOrder = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value as ArchiveSortOrder);
  };

  return (
    <div className="flex items-center justify-between space-x-2 md:justify-end">
      <div className="text-[12px] font-bold tracking-widest opacity-40">
        {t("archive.sortBy")}:
      </div>

      <select
        aria-label="sort-order"
        className="hover:text-archive-accent *:bg-archive-paper cursor-pointer border-none text-sm font-medium italic transition-colors duration-100 focus:ring-0"
        value={sortOrder}
        onChange={handleChangeSortOrder}
      >
        <option value={ArchiveSortOrder.NewestFirst}>
          {t("archive.sortOrder.newest")}
        </option>
        <option value={ArchiveSortOrder.OldestFirst}>
          {t("archive.sortOrder.oldest")}
        </option>
      </select>
    </div>
  );
}
