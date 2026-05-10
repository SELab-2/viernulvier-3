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
    <div className="flex items-center justify-between gap-2 font-sans md:justify-end">
      <div className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase opacity-45">
        {t("archive.sortBy")}:
      </div>

      <select
        aria-label="sort-order"
        className="*:bg-archive-paper hover:text-archive-accent cursor-pointer border-none bg-transparent text-sm font-medium tracking-[0.02em] transition-colors duration-100 focus:ring-0"
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
