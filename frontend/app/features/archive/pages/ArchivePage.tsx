import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import type { Tag } from "~/features/archive/types/tagTypes";
import { Outlet, useSearchParams } from "react-router";

import {
  ArchiveSortOrder,
  ProductionTimeline,
} from "~/features/archive/components/ProductionTimeline";
import { Divider } from "@mui/material";
import { getAllProductionGroups } from "~/features/archive/services/productionGroupService";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import type { ProductionList } from "~/features/archive/types/productionTypes";
import FilterSidebar from "../components/FilterSidebar";
import { SortOrderSelection } from "../components/SortOrderSelection";
import { CreateProductionButton } from "../components/CreateProductionButton";
import { ShowMoreButton } from "../components/ShowMoreButton";
import { MobileToggleButton } from "../components/MobileToggleButton";
import { archiveSortOrderToBackendSortOrder } from "../utils/archiveMapping";
import { useDebouncedState } from "../utils/debouncedState";

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
          productionGroups={productionGroups}
          selectedProductionGroups={selectedProductionGroups}
          setSelectedProductionGroups={handleSelectedProductionGroupsChange}
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
