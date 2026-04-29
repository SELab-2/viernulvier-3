import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "~/features/archive/types/tagTypes";
import { Outlet } from "react-router";

import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { Divider } from "@mui/material";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import type { ProductionList } from "~/features/archive/types/productionTypes";
import FilterSidebar from "../components/FilterSidebar";
import { SortOrderSelection } from "../components/SortOrderSelection";
import { CreateProductionButton } from "../components/CreateProductionButton";
import { ShowMoreButton } from "../components/ShowMoreButton";
import { MobileToggleButton } from "../components/MobileToggleButton";
import { archiveSortOrderToBackendSortOrder } from "../utils/archiveMapping";
import { useDebouncedState } from "../utils/debouncedState";

function buildProductionFilters({
  debouncedSearch,
  debouncedDateFrom,
  debouncedDateTo,
  selectedTags,
  selectedArtists,
}: {
  debouncedSearch: string;
  debouncedDateFrom: string;
  debouncedDateTo: string;
  selectedTags: Tag[];
  selectedArtists: string[];
}) {
  return {
    production_name: debouncedSearch || undefined,
    earliest_at: debouncedDateFrom || undefined,
    latest_at: debouncedDateTo || undefined,
    tag_ids:
      selectedTags.length > 0
        ? selectedTags.map((tag) => tag.id_url.split("/").pop()!)
        : undefined,
    artists: selectedArtists.length > 0 ? selectedArtists : undefined,
  };
}

export default function ArchivePage() {
  const { t, i18n } = useTranslation();

  const [sortOrder, setSortOrder] = useState<ArchiveSortOrder>(
    ArchiveSortOrder.NewestFirst
  );

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, debouncedSearch, setSearchQuery] = useDebouncedState("");
  const [dateFrom, debouncedDateFrom, setDateFrom] = useDebouncedState("");
  const [dateTo, debouncedDateTo, setDateTo] = useDebouncedState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [productionList, setProductionList] = useState<ProductionList | null>(null);

  const filters = useMemo(
    () =>
      buildProductionFilters({
        debouncedSearch,
        debouncedDateFrom,
        debouncedDateTo,
        selectedTags,
        selectedArtists,
      }),
    [debouncedSearch, debouncedDateFrom, debouncedDateTo, selectedTags, selectedArtists]
  );

  // Re-fetch whenever any filter changes
  useEffect(() => {
    async function fetchProductions() {
      const result = await getProductionsPaginated({
        ...filters,
        sort_order: archiveSortOrderToBackendSortOrder[sortOrder],
      });
      setProductionList(result);
    }
    fetchProductions();
  }, [filters, sortOrder, i18n.resolvedLanguage]);

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
              filters={filters}
            />
          )}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
