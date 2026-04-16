import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import FilterSidebar from "~/shared/components/FilterSidebar";
import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { Divider } from "@mui/material";
import { useAsyncFetch } from "~/shared/hooks/useAsyncFetch";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import { getByUrl } from "~/shared/services/sharedService";
import type { Event } from "~/features/archive/types/eventTypes";
import type { ProductionList } from "~/features/archive/types/productionTypes";

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

function MobileToggleButton({ onClick }: { onClick: () => void }) {
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
}: {
  productionList: ProductionList;
  setProductionList: React.Dispatch<React.SetStateAction<ProductionList | null>>;
}) {
  const { t } = useTranslation();

  async function onClick() {
    let next_productions = await getProductionsPaginated({
      cursor: productionList.pagination.next_cursor,
    });
    // TODO make this not fetch all events for every production.
    const productions = await Promise.all(
      next_productions.productions.map(async (production) => ({
        ...production,
        events: await Promise.all(
          production.event_id_urls.map((eventUrl) => getByUrl<Event>(eventUrl))
        ),
      }))
    );
    next_productions = { ...next_productions, productions };

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
        {productionList.pagination.next_cursor}
        {t("archive.show_more")}
      </button>
    </div>
  );
}

export default function Archive() {
  const [sortOrder, setSortOrder] = useState<ArchiveSortOrder>(
    ArchiveSortOrder.NewestFirst
  );

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("1970-01-01");
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [dateTo, setDateTo] = useState(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  const toggleMobileFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const { t } = useTranslation();

  const { data: productionList, setData: setProductionList } =
    useAsyncFetch<ProductionList>(
      useCallback(async () => {
        const productionList = await getProductionsPaginated();
        // TODO make this not fetch all events for every production.
        const productions = await Promise.all(
          productionList.productions.map(async (production) => ({
            ...production,
            events: await Promise.all(
              production.event_id_urls.map((eventUrl) => getByUrl<Event>(eventUrl))
            ),
          }))
        );
        return { ...productionList, productions };
      }, [])
    );
  const productions = productionList?.productions ?? [];

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
          className="min-w-1/4"
          show={showFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateTo={dateTo}
          setDateTo={setDateTo}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          selectedVenues={selectedVenues}
          setSelectedVenues={setSelectedVenues}
          selectedArtists={selectedArtists}
          setSelectedArtists={setSelectedArtists}
        />
        <div className="w-full">
          {/* Production list header */}
          <div className="mb-4 flex flex-row items-center justify-between">
            <p className="italic opacity-60 md:text-lg">
              {productions.length}{" "}
              {productions.length == 1 ? t("archive.result") : t("archive.results")}
            </p>
            <SortOrderSelection sortOrder={sortOrder} setSortOrder={setSortOrder} />
          </div>
          <Divider className="bg-archive-ink/5" />

          {/* Production list view */}
          {productions && productions.length > 0 ? (
            <ProductionTimeline productions={productions} sortOrder={sortOrder} />
          ) : (
            <div className="flex min-h-[50vh] w-full flex-col items-center justify-center">
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
