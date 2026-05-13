import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
  getVisuals,
  getVisualTypes,
  uploadVisual,
  deleteVisual,
} from "~/features/visuals/services/visualService";
import type {
  VisualItem,
  VisualType,
} from "~/features/visuals/types/visualTypes";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

const PAGE_SIZE = 20;

const HERO_IMAGE = "/images/1914_Inhuldiging.jpg";

export default function VisualsPage() {
  const { t, i18n } = useTranslation();
  const [visuals, setVisuals] = useState<VisualItem[]>([]);
  const [visualTypes, setVisualTypes] = useState<VisualType[]>([]);
  const [selectedType, setSelectedType] = useState<VisualType | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function fetchTypes() {
      try {
        const types = await getVisualTypes();
        if (!isActive) return;
        setVisualTypes(types);
      } catch {
        // types are optional, silently ignore
      }
    }

    void fetchTypes();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function fetchVisuals() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params: Record<string, unknown> = { limit: PAGE_SIZE };
        if (selectedType) {
          params.visual_type = selectedType;
        }

        const result = await getVisuals(params);
        if (!isActive) return;

        setVisuals(result.visuals);
        setHasMore(result.pagination.has_more);
        setTotalCount(result.pagination.total_count);
      } catch (error) {
        if (!isActive) return;
        setVisuals([]);
        setErrorMessage(
          error instanceof Error ? error.message : t("visuals.error")
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void fetchVisuals();

    return () => {
      isActive = false;
    };
  }, [i18n.resolvedLanguage, selectedType, t]);

  async function handleLoadMore() {
    if (!hasMore || visuals.length === 0) return;

    try {
      const lastId = Number(
        visuals[visuals.length - 1].id_url.split("/").pop()
      );
      const params: Record<string, unknown> = {
        cursor: lastId,
        limit: PAGE_SIZE,
      };
      if (selectedType) {
        params.visual_type = selectedType;
      }

      const result = await getVisuals(params);
      setVisuals((prev) => [...prev, ...result.visuals]);
      setHasMore(result.pagination.has_more);
    } catch (error) {
      window.alert(
        t("visuals.messages.loadMoreFailed", {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const created = await uploadVisual(file, {
        visual_type: selectedType || undefined,
      });
      setVisuals((prev) => [created, ...prev]);
      setTotalCount((prev) => prev + 1);
    } catch (error) {
      window.alert(
        t("visuals.messages.uploadFailed", {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(visualId: number) {
    if (!window.confirm(t("visuals.messages.confirmDelete"))) return;

    try {
      await deleteVisual(visualId);
      setVisuals((prev) =>
        prev.filter((v) => Number(v.id_url.split("/").pop()) !== visualId)
      );
      setTotalCount((prev) => prev - 1);
    } catch (error) {
      window.alert(
        t("visuals.messages.deleteFailed", {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  function isImageItem(item: VisualItem): boolean {
    return item.content_type.startsWith("image/");
  }

  function renderMain() {
    return (
      <>
        <title>{`${t("nav.visuals")} | VIERNULVIER`}</title>
        {renderHeroSection()}
        {renderContentSection()}
      </>
    );
  }

  function renderHeroSection() {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <img
          data-testid="visuals-hero"
          src={HERO_IMAGE}
          alt={t("visuals.heroAlt")}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="font-serif text-[clamp(3rem,7vw,6rem)] text-[#f0e4d3] italic drop-shadow-lg">
            {t("visuals.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            {t("visuals.subtitle")}
          </p>
        </div>
      </section>
    );
  }

  function renderContentSection() {
    return (
      <section className="mx-6 md:mx-10">
        <div className="mx-auto max-w-7xl py-12">
          {renderFilterBar()}
          {isLoading
            ? renderLoadingState()
            : errorMessage
              ? renderErrorState()
              : visuals.length > 0
                ? renderGallery()
                : renderEmptyState()}
        </div>
      </section>
    );
  }

  function renderFilterBar() {
    return (
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              selectedType === ""
                ? "bg-archive-accent text-white"
                : "bg-archive-ink/10 hover:bg-archive-ink/20"
            }`}
            onClick={() => setSelectedType("")}
          >
            {t("visuals.filters.all")}
          </button>
          {visualTypes.map((type) => (
            <button
              key={type}
              className={`rounded px-4 py-2 text-sm font-medium capitalize transition-colors ${
                selectedType === type
                  ? "bg-archive-accent text-white"
                  : "bg-archive-ink/10 hover:bg-archive-ink/20"
              }`}
              onClick={() => setSelectedType(type)}
            >
              {t(`visuals.types.${type}`, type)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!isLoading && (
            <span className="text-sm opacity-60">
              {t("visuals.count", { count: totalCount })}
            </span>
          )}
          <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
            <label className="bg-archive-accent hover:bg-archive-accent/90 cursor-pointer rounded px-4 py-2 text-sm font-medium text-white transition-colors">
              {isUploading ? t("visuals.upload.uploading") : t("visuals.upload.button")}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf"
                className="hidden"
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>
          </Protected>
        </div>
      </div>
    );
  }

  function renderLoadingState() {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-serif text-3xl italic opacity-60">
          {t("visuals.loading")}
        </p>
      </div>
    );
  }

  function renderErrorState() {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="font-serif text-3xl italic opacity-60">
          {t("visuals.errorTitle")}
        </p>
        <p className="mt-3 max-w-2xl opacity-70">{errorMessage}</p>
      </div>
    );
  }

  function renderEmptyState() {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
        <p className="font-serif text-3xl italic opacity-60">
          {t("visuals.empty.title")}
        </p>
        <p className="mt-3 max-w-2xl opacity-70">
          {t("visuals.empty.description")}
        </p>
      </div>
    );
  }

  function renderGallery() {
    return (
      <>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visuals.map((visual) => renderVisualCard(visual))}
        </div>
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              className="bg-archive-accent hover:bg-archive-accent/90 rounded px-6 py-3 text-sm font-medium text-white transition-colors"
              onClick={handleLoadMore}
            >
              {t("visuals.showMore")}
            </button>
          </div>
        )}
      </>
    );
  }

  function renderVisualCard(visual: VisualItem) {
    const visualId = Number(visual.id_url.split("/").pop());

    return (
      <div
        key={visual.id_url}
        className="bg-archive-paper border-archive-ink/10 group overflow-hidden rounded border shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-archive-ink/5">
          {isImageItem(visual) ? (
            <img
              src={visual.url}
              alt={visual.title || t("visuals.card.noTitle")}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-serif text-4xl opacity-20">
                {visual.content_type.startsWith("video/") ? "▶" : "📄"}
              </span>
            </div>
          )}
          <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
            <button
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              onClick={() => handleDelete(visualId)}
              aria-label={t("visuals.delete")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Protected>
        </div>
        <div className="p-4">
          <h3 className="font-serif text-lg">
            {visual.title || t("visuals.card.noTitle")}
          </h3>
          {visual.description && (
            <p className="mt-1 line-clamp-2 text-sm opacity-70">
              {visual.description}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs opacity-50">
            <span className="capitalize">
              {t(`visuals.types.${visual.visual_type}`, visual.visual_type ?? "")}
            </span>
            <span>
              {new Date(visual.uploaded_at).toLocaleDateString(
                i18n.resolvedLanguage === "nl" ? "nl-BE" : "en-US"
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return renderMain();
}
