import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import type { Tag } from "~/features/archive/types/tagTypes";
import { Outlet, useSearchParams } from "react-router";

import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { getAllProductionGroups } from "~/features/archive/services/productionGroupService";
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

const PRODUCTION_GROUP_QUERY_PARAM = "group";

function toProductionGroupQueryValue(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getRequestedProductionGroupFilters(searchParams: URLSearchParams): string[] {
  return searchParams.getAll(PRODUCTION_GROUP_QUERY_PARAM).filter(Boolean);
}

function resolveProductionGroupsByQuery(
  productionGroups: ProductionGroup[],
  requestedSlugs: string[]
): ProductionGroup[] {
  const slugMap = new Map(
    productionGroups.map((group) => [toProductionGroupQueryValue(group.title), group])
  );
  const seen = new Set<string>();
  const resolved: ProductionGroup[] = [];

  for (const slug of requestedSlugs) {
    const group = slugMap.get(toProductionGroupQueryValue(slug));
    if (group && !seen.has(group.id_url)) {
      seen.add(group.id_url);
      resolved.push(group);
    }
  }

  return resolved;
}

function haveSameProductionGroups(
  left: ProductionGroup[],
  right: ProductionGroup[]
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (productionGroup, index) => productionGroup.id_url === right[index]?.id_url
    )
  );
}

function buildProductionFilters({
  debouncedSearch,
  debouncedDateFrom,
  debouncedDateTo,
  selectedTags,
  selectedProductionGroups,
  selectedArtists,
}: {
  debouncedSearch: string;
  debouncedDateFrom: string;
  debouncedDateTo: string;
  selectedTags: Tag[];
  selectedProductionGroups: ProductionGroup[];
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
    group_ids:
      selectedProductionGroups.length > 0
        ? selectedProductionGroups.map((group) => group.id_url.split("/").pop()!)
        : undefined,
    artists: selectedArtists.length > 0 ? selectedArtists : undefined,
  };
}

export default function ArchivePage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [selectedProductionGroups, setSelectedProductionGroups] = useState<
    ProductionGroup[]
  >([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [productionList, setProductionList] = useState<ProductionList | null>(null);
  const [productionGroups, setProductionGroups] = useState<ProductionGroup[]>([]);
  const [haveLoadedProductionGroups, setHaveLoadedProductionGroups] = useState(false);

  const requestedProductionGroupFilters = useMemo(
    () => getRequestedProductionGroupFilters(searchParams),
    [searchParams]
  );

  const matchedProductionGroupsFromUrl = useMemo(
    () =>
      resolveProductionGroupsByQuery(productionGroups, requestedProductionGroupFilters),
    [productionGroups, requestedProductionGroupFilters]
  );
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);

  const filters = useMemo(
    () =>
      buildProductionFilters({
        debouncedSearch,
        debouncedDateFrom,
        debouncedDateTo,
        selectedTags,
        selectedProductionGroups,
        selectedArtists,
      }),
    [
      debouncedSearch,
      debouncedDateFrom,
      debouncedDateTo,
      selectedTags,
      selectedProductionGroups,
      selectedArtists,
    ]
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchProductionGroups() {
      try {
        const result = await getAllProductionGroups();

        if (!isCancelled) {
          setProductionGroups(result);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!isCancelled) {
          setHaveLoadedProductionGroups(true);
        }
      }
    }

    fetchProductionGroups();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!haveLoadedProductionGroups) {
      return;
    }

    if (
      haveSameProductionGroups(selectedProductionGroups, matchedProductionGroupsFromUrl)
    ) {
      return;
    }

    setSelectedProductionGroups(matchedProductionGroupsFromUrl);
  }, [
    haveLoadedProductionGroups,
    matchedProductionGroupsFromUrl,
    selectedProductionGroups,
  ]);

  const handleSelectedProductionGroupsChange = (nextGroups: ProductionGroup[]) => {
    setSelectedProductionGroups(nextGroups);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PRODUCTION_GROUP_QUERY_PARAM);
        for (const group of nextGroups) {
          next.append(
            PRODUCTION_GROUP_QUERY_PARAM,
            toProductionGroupQueryValue(group.title)
          );
        }
        return next;
      },
      { replace: true }
    );
  };

  // Re-fetch whenever any filter changes
  useEffect(() => {
    if (
      !haveLoadedProductionGroups ||
      !haveSameProductionGroups(
        selectedProductionGroups,
        matchedProductionGroupsFromUrl
      )
    ) {
      return;
    }

    async function fetchProductions() {
      const result = await getProductionsPaginated({
        ...filters,
        sort_order: archiveSortOrderToBackendSortOrder[sortOrder],
      });
      setProductionList(result);
    }
    fetchProductions();
  }, [
    filters,
    haveLoadedProductionGroups,
    i18n.resolvedLanguage,
    matchedProductionGroupsFromUrl,
    selectedProductionGroups,
    sortOrder,
  ]);

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
          productionGroups={productionGroups}
          selectedProductionGroups={selectedProductionGroups}
          setSelectedProductionGroups={handleSelectedProductionGroupsChange}
          selectedArtists={selectedArtists}
          setSelectedArtists={setSelectedArtists}
        />
        <div className="w-full">
          {/* Production list header */}
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="center-items flex flex-wrap items-center gap-3 font-sans md:gap-4">
              <p className="text-archive-ink/60 text-sm font-medium tracking-[0.02em] md:text-base">
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
                    "fontFamily": "var(--font-sans)",
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
            <div className="border-archive-accent/20 bg-archive-surface/60 mb-4 flex flex-col gap-3 rounded-2xl border px-5 py-3.5 font-sans backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
              <p className="text-archive-ink text-lg font-medium tracking-[0.01em] md:text-xl">
                <span className="text-archive-accent font-semibold">
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
                    "fontFamily": "var(--font-sans)",
                    "textTransform": "uppercase",
                    "letterSpacing": "0.08em",
                    "fontSize": "0.72rem",
                    "fontWeight": 600,
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
