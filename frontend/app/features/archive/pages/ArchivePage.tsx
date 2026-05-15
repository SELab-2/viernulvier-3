import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import type { Tag } from "~/features/archive/types/tagTypes";
import { Outlet, useSearchParams } from "react-router";

import { ProductionTimeline } from "~/features/archive/components/ProductionTimeline";
import { getAllProductionGroups } from "~/features/archive/services/productionGroupService";
import { Button, Divider } from "@mui/material";
import { getProductionsPaginated } from "~/features/archive/services/productionService";
import type { ProductionList } from "~/features/archive/types/productionTypes";
import FilterSidebar from "../components/FilterSidebar";
import { CreateProductionButton } from "../components/CreateProductionButton";
import { ShowMoreButton } from "../components/ShowMoreButton";
import { MobileToggleButton } from "../components/MobileToggleButton";
import { CreateProductionGroupDialog } from "../components/CreateProductionGroupDialog";
import { DeleteProductionGroupDialog } from "../components/DeleteProductionGroupDialog";
import { useDebouncedState } from "../utils/debouncedState";
import {
  SortOrderEnum,
  SortOrderSelection,
} from "~/shared/components/SortOrderSelection";
import { frontendSortOrderToBackendSortOrder } from "~/shared/utils/orderMapping";
import { Protected, useAuthSession } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import {
  getProductionGroupId,
  getRequestedProductionGroupIds,
  PRODUCTION_GROUP_QUERY_PARAM,
  resolveProductionGroupsByIds,
} from "../utils/productionGroupFilters";

function buildProductionFilters({
  debouncedSearch,
  debouncedDateFrom,
  debouncedDateTo,
  selectedTags,
  selectedProductionGroupIds,
  selectedArtists,
}: {
  debouncedSearch: string;
  debouncedDateFrom: string;
  debouncedDateTo: string;
  selectedTags: Tag[];
  selectedProductionGroupIds: string[];
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
      selectedProductionGroupIds.length > 0 ? selectedProductionGroupIds : undefined,
    artists: selectedArtists.length > 0 ? selectedArtists : undefined,
  };
}

function matchesExactlySelectedProductionIds(
  selectedProductionIds: string[],
  productionIds: string[]
): boolean {
  const uniqueSelectedProductionIds = Array.from(new Set(selectedProductionIds));
  const uniqueProductionIds = Array.from(new Set(productionIds));

  if (
    uniqueSelectedProductionIds.length === 0 ||
    uniqueSelectedProductionIds.length !== uniqueProductionIds.length
  ) {
    return false;
  }

  const selectedProductionIdSet = new Set(uniqueSelectedProductionIds);
  return uniqueProductionIds.every((productionId) =>
    selectedProductionIdSet.has(productionId)
  );
}

export default function ArchivePage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthSession();

  const canCreateArchive =
    isAuthenticated &&
    !!(user?.isSuperUser || user?.permissions.includes(ARCHIVE_PERMISSIONS.create));
  const canDeleteArchive =
    isAuthenticated &&
    !!(user?.isSuperUser || user?.permissions.includes(ARCHIVE_PERMISSIONS.delete));
  const canManageProductionGroups = canCreateArchive || canDeleteArchive;
  const isSelectable = canManageProductionGroups;

  const [sortOrder, setSortOrder] = useState<SortOrderEnum>(SortOrderEnum.NewestFirst);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, debouncedSearch, setSearchQuery] = useDebouncedState("");
  const [dateFrom, debouncedDateFrom, setDateFrom] = useDebouncedState("");
  const [dateTo, debouncedDateTo, setDateTo] = useDebouncedState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [productionList, setProductionList] = useState<ProductionList | null>(null);
  const [productionGroups, setProductionGroups] = useState<ProductionGroup[]>([]);
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);
  const [isCreateProductionGroupDialogOpen, setIsCreateProductionGroupDialogOpen] =
    useState(false);
  const [productionGroupToDelete, setProductionGroupToDelete] =
    useState<ProductionGroup | null>(null);

  const selectedProductionGroupIds = useMemo(
    () => getRequestedProductionGroupIds(searchParams),
    [searchParams]
  );

  const selectedProductionGroups = useMemo(
    () => resolveProductionGroupsByIds(productionGroups, selectedProductionGroupIds),
    [productionGroups, selectedProductionGroupIds]
  );

  const filters = useMemo(
    () =>
      buildProductionFilters({
        debouncedSearch,
        debouncedDateFrom,
        debouncedDateTo,
        selectedTags,
        selectedProductionGroupIds,
        selectedArtists,
      }),
    [
      debouncedSearch,
      debouncedDateFrom,
      debouncedDateTo,
      selectedTags,
      selectedProductionGroupIds,
      selectedArtists,
    ]
  );

  useEffect(() => {
    let isCancelled = false;

    async function fetchProductionGroups() {
      try {
        const result = await getAllProductionGroups(!canManageProductionGroups);

        if (!isCancelled) {
          setProductionGroups(result);
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchProductionGroups();

    return () => {
      isCancelled = true;
    };
  }, [canManageProductionGroups]);

  const handleSelectedProductionGroupsChange = (nextGroups: ProductionGroup[]) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PRODUCTION_GROUP_QUERY_PARAM);

        const nextGroupIds = nextGroups
          .map(getProductionGroupId)
          .filter((groupId) => groupId.length > 0);

        for (const groupId of new Set(nextGroupIds)) {
          next.append(PRODUCTION_GROUP_QUERY_PARAM, groupId);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Re-fetch whenever any filter changes
  useEffect(() => {
    async function fetchProductions() {
      const result = await getProductionsPaginated({
        ...filters,
        sort_order: frontendSortOrderToBackendSortOrder[sortOrder],
      });
      setProductionList(result);
    }
    fetchProductions();
  }, [filters, i18n.resolvedLanguage, sortOrder]);

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

  // Only expose the delete action when the archive is filtered to exactly one
  // production group and the current selection matches that group's full set.
  const selectedProductionGroupForDeletion = useMemo(() => {
    if (
      selectedProductionGroupIds.length !== 1 ||
      selectedProductionGroups.length !== 1
    ) {
      return null;
    }

    const [productionGroup] = selectedProductionGroups;

    return matchesExactlySelectedProductionIds(
      selectedProductionIds,
      productionGroup.production_id_urls
    )
      ? productionGroup
      : null;
  }, [selectedProductionGroupIds, selectedProductionGroups, selectedProductionIds]);

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

  const handleProductionGroupCreated = (productionGroup: ProductionGroup) => {
    setProductionGroups((currentGroups) => {
      const existingIndex = currentGroups.findIndex(
        (currentGroup) => currentGroup.id_url === productionGroup.id_url
      );

      if (existingIndex === -1) {
        return [...currentGroups, productionGroup];
      }

      const nextGroups = [...currentGroups];
      nextGroups[existingIndex] = productionGroup;
      return nextGroups;
    });

    setSelectedProductionIds([]);
    setIsCreateProductionGroupDialogOpen(false);
  };

  const handleProductionGroupDeleted = (deletedProductionGroup: ProductionGroup) => {
    setProductionGroups((currentGroups) =>
      currentGroups.filter(
        (currentGroup) => currentGroup.id_url !== deletedProductionGroup.id_url
      )
    );
    setSelectedProductionIds([]);
    setProductionGroupToDelete(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PRODUCTION_GROUP_QUERY_PARAM);
        return next;
      },
      { replace: true }
    );
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
          selectedProductionGroupIds={selectedProductionGroupIds}
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
              <Protected
                permissions={[ARCHIVE_PERMISSIONS.create, ARCHIVE_PERMISSIONS.delete]}
                requireAllPermissions={false}
              >
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
                <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setIsCreateProductionGroupDialogOpen(true)}
                    sx={{
                      "backgroundColor": "var(--color-archive-accent)",
                      "color": "var(--color-archive-paper)",
                      "fontFamily": "var(--font-sans)",
                      "textTransform": "uppercase",
                      "letterSpacing": "0.08em",
                      "fontSize": "0.72rem",
                      "fontWeight": 600,
                      "boxShadow": "none",
                      "&:hover": {
                        backgroundColor: "#92653e",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {t("archive.productionGroups.actions.create")}
                  </Button>
                </Protected>
                <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
                  {selectedProductionGroupForDeletion ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setProductionGroupToDelete(selectedProductionGroupForDeletion)
                      }
                      sx={{
                        "borderColor": "rgba(192, 57, 43, 0.4)",
                        "color": "#c0392b",
                        "fontFamily": "var(--font-sans)",
                        "textTransform": "uppercase",
                        "letterSpacing": "0.08em",
                        "fontSize": "0.72rem",
                        "fontWeight": 600,
                        "&:hover": {
                          borderColor: "rgba(192, 57, 43, 0.55)",
                          backgroundColor: "rgba(192, 57, 43, 0.08)",
                        },
                      }}
                    >
                      {t("archive.productionGroups.actions.delete")}
                    </Button>
                  ) : null}
                </Protected>
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
      <CreateProductionGroupDialog
        open={isCreateProductionGroupDialogOpen}
        selectedProductionIds={selectedProductionIds}
        onClose={() => setIsCreateProductionGroupDialogOpen(false)}
        onCreated={handleProductionGroupCreated}
      />
      <DeleteProductionGroupDialog
        productionGroup={productionGroupToDelete}
        onClose={() => setProductionGroupToDelete(null)}
        onDeleted={handleProductionGroupDeleted}
      />
      <Outlet />
    </div>
  );
}
