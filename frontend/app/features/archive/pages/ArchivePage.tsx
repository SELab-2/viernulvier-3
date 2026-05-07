import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Tag } from "~/features/archive/types/tagTypes";
import { Outlet } from "react-router";

import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { Button, Divider } from "@mui/material";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import type { ProductionList } from "~/features/archive/types/productionTypes";
import FilterSidebar from "../components/FilterSidebar";
import { SortOrderSelection } from "../components/SortOrderSelection";
import { CreateProductionButton } from "../components/CreateProductionButton";
import { ShowMoreButton } from "../components/ShowMoreButton";
import { MobileToggleButton } from "../components/MobileToggleButton";
import { archiveSortOrderToBackendSortOrder } from "../utils/archiveMapping";
import { useDebouncedState } from "../utils/debouncedState";
import { Protected, useAuthSession } from "~/features/auth";

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
  const { isAuthenticated, user } = useAuthSession();

  const isSelectable =
    isAuthenticated &&
    !!(user?.isSuperUser || user?.permissions.includes("archive:create"));

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
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);

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

  const productions = useMemo(
    () => productionList?.productions ?? [],
    [productionList]
  );
  const total_count = productionList?.pagination.total_count ?? 0;
  const visibleProductionIds = useMemo(
    () => productions.map((production) => production.id_url),
    [productions]
  );
  const allVisibleSelected =
    visibleProductionIds.length > 0 &&
    visibleProductionIds.every((id) => selectedProductionIds.includes(id));

  const toggleMobileFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const handleToggleProductionSelection = (productionId: string) => {
    setSelectedProductionIds((prev) =>
      prev.includes(productionId)
        ? prev.filter((id) => id !== productionId)
        : [...prev, productionId]
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedProductionIds(visibleProductionIds);
  };

  const handleClearSelection = () => {
    setSelectedProductionIds([]);
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
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="center-items flex flex-wrap items-center gap-4">
              <p className="italic opacity-60 md:text-lg">
                {/* Result count */}
                {total_count}{" "}
                {total_count === 1 ? t("archive.result") : t("archive.results")}
              </p>
              <CreateProductionButton />
              <Protected permissions={["archive:create"]}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleSelectAllVisible}
                  disabled={visibleProductionIds.length === 0 || allVisibleSelected}
                  sx={{
                    "color": "var(--color-archive-ink)",
                    "opacity": 0.55,
                    "textTransform": "uppercase",
                    "letterSpacing": "0.08em",
                    "fontSize": "0.72rem",
                    "fontWeight": 600,
                    "&:hover": { opacity: 1 },
                    "&:disabled": { opacity: 0.25 },
                  }}
                >
                  {t("archive.selection.select_all")}
                </Button>
              </Protected>
            </div>
            <SortOrderSelection sortOrder={sortOrder} setSortOrder={setSortOrder} />
          </div>

          {selectedProductionIds.length > 0 ? (
            <div className="border-archive-accent/20 bg-archive-surface/60 mb-4 flex flex-col gap-3 rounded-2xl border px-5 py-3.5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
              <p className="text-archive-ink font-serif text-xl tracking-tight">
                <span className="text-archive-accent font-bold">
                  {selectedProductionIds.length}
                </span>{" "}
                {selectedProductionIds.length === 1
                  ? t("archive.selection.selected_singular")
                  : t("archive.selection.selected_plural")}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {/* Future bulk actions go here */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearSelection}
                  sx={{
                    "borderColor": "var(--color-archive-accent)",
                    "color": "var(--color-archive-accent)",
                    "textTransform": "uppercase",
                    "letterSpacing": "0.08em",
                    "fontSize": "0.72rem",
                    "&:hover": {
                      borderColor: "var(--color-archive-accent)",
                      backgroundColor:
                        "color-mix(in srgb, var(--color-archive-accent) 8%, transparent)",
                    },
                  }}
                >
                  {t("archive.selection.clear")}
                </Button>
              </div>
            </div>
          ) : null}

          <Divider className="bg-archive-ink/5" />

          {/* Production list view */}
          {productions && productions.length > 0 ? (
            <ProductionTimeline
              productions={productions}
              sortOrder={sortOrder}
              isSelectable={isSelectable}
              selectedProductionIds={selectedProductionIds}
              onToggleProductionSelection={handleToggleProductionSelection}
            />
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
