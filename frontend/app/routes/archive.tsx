import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "~/features/archive/types/tagTypes";
import FilterSidebar from "../features/archive/components/FilterSidebar";
import { Add } from "@mui/icons-material";
import { Outlet } from "react-router";

import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { Divider } from "@mui/material";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import type { ProductionList } from "~/features/archive/types/productionTypes";
import { Protected } from "~/features/auth";

const archiveSortOrderToBackendSortOrder: Record<ArchiveSortOrder, string> = {
  [ArchiveSortOrder.NewestFirst]: "Descending",
  [ArchiveSortOrder.OldestFirst]: "Ascending",
};

function SortOrderSelection({
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

function CreateProductionButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Protected permissions={["archive:create"]}>
      <div
        className="bg-archive-accent/90 hover:bg-archive-accent flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
        onClick={onClick}
      >
        <Add /> <p>{t("archive.create_production")}</p>
      </div>
    </Protected>
  );
}

function FilterIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      data-darkreader-inline-stroke=""
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      ></path>
    </svg>
  );
}

function MobileToggleButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="bg-archive-ink/5 border-archive-ink/10 mb-8 flex w-full cursor-pointer items-center justify-center space-x-3 rounded-xl border py-3 text-xs font-bold tracking-widest uppercase lg:hidden"
    >
      <FilterIcon />
      <span>{t("filter.toggle_menu")}</span>
    </button>
  );
}

function ShowMoreButton({
  productionList,
  setProductionList,
  sortOrder,
  filters,
}: {
  productionList: ProductionList;
  setProductionList: React.Dispatch<React.SetStateAction<ProductionList | null>>;
  sortOrder: ArchiveSortOrder;
  filters: {
    production_name?: string;
    earliest_at?: string;
    latest_at?: string;
    tag_ids?: string[];
    artists?: string[];
  };
}) {
  const { t } = useTranslation();

  async function onClick() {
    const next_productions = await getProductionsPaginated({
      cursor: productionList.pagination.next_cursor,
      sort_order: archiveSortOrderToBackendSortOrder[sortOrder],
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

export default function Archive() {
  const { t, i18n } = useTranslation();

  const [sortOrder, setSortOrder] = useState<ArchiveSortOrder>(
    ArchiveSortOrder.NewestFirst
  );

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [productionList, setProductionList] = useState<ProductionList | null>(null);
  // Debounce searchQuery so we don't fire on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Re-fetch whenever any filter changes
  useEffect(() => {
    async function fetchProductions() {
      const result = await getProductionsPaginated({
        production_name: debouncedSearch || undefined,
        earliest_at: dateFrom || undefined,
        latest_at: dateTo || undefined,
        sort_order: archiveSortOrderToBackendSortOrder[sortOrder],
        tag_ids:
          selectedTags.length > 0
            ? selectedTags.map((tag) => tag.id_url.split("/").pop()!)
            : undefined,
        artists: selectedArtists.length > 0 ? selectedArtists : undefined,
      });
      setProductionList(result);
    }
    fetchProductions();
  }, [
    debouncedSearch,
    dateFrom,
    dateTo,
    selectedTags,
    selectedArtists,
    sortOrder,
    i18n.resolvedLanguage,
  ]);
  const productions = productionList?.productions ?? [];
  const total_count = productionList?.pagination.total_count ?? 0;

  const toggleMobileFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <div className="mx-6 md:mx-10">
      <title>{`${t("nav.archive")} | VIERNULVIER`}</title>
      <div className="mb-10 md:mb-16">
        <h1 className="mt-10 h-20 font-serif text-5xl italic md:text-7xl">
          {t("archive.title")}
        </h1>
      </div>

      <MobileToggleButton onClick={toggleMobileFilters} />
      <div className="relative mb-0 flex flex-col items-start gap-5 lg:flex-row">
        <FilterSidebar
          show={showFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedArtists={selectedArtists}
          setSelectedArtists={setSelectedArtists}
        />
        <div className="w-full">
          {/* Production list header */}
          <div className="mb-4 flex flex-row items-center justify-between">
            <div className="center-items flex justify-between space-x-4">
              <p className="italic opacity-60 md:text-lg">
                {/* Result count */}
                {total_count}{" "}
                {total_count === 1 ? t("archive.result") : t("archive.results")}
              </p>
              <CreateProductionButton />
            </div>
            <SortOrderSelection sortOrder={sortOrder} setSortOrder={setSortOrder} />
          </div>
          <Divider className="bg-archive-ink/5" />

          {/* Production list view */}
          {productions && productions.length > 0 ? (
            <ProductionTimeline productions={productions} sortOrder={sortOrder} />
          ) : (
            <div className="flex min-h-[50vh] w-full flex-col items-center justify-center">
              {/* No Results */}
              <p className="text-center font-serif text-3xl tracking-tighter opacity-50">
                {t("archive.no_results.header")}
              </p>
              <p className="opacity-35">{t("archive.no_results.subtext")}</p>
            </div>
          )}

          {productionList && productionList.pagination.has_more && (
            <ShowMoreButton
              productionList={productionList}
              setProductionList={setProductionList}
              sortOrder={sortOrder}
              filters={{
                production_name: debouncedSearch || undefined,
                earliest_at: dateFrom || undefined,
                latest_at: dateTo || undefined,
                tag_ids:
                  selectedTags.length > 0
                    ? selectedTags.map((tag) => tag.id_url.split("/").pop()!)
                    : undefined,
                artists: selectedArtists.length > 0 ? selectedArtists : undefined,
              }}
            />
          )}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
