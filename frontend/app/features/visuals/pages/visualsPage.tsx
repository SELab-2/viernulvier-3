import { useEffect, useState, useRef, useCallback } from "react";
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
  const [lightboxVisual, setLightboxVisual] = useState<VisualItem | null>(
    null
  );

  const closeLightbox = useCallback(() => setLightboxVisual(null), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
    }
    if (lightboxVisual) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxVisual, closeLightbox]);

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
        {renderHeader()}
        {renderContentSection()}
        {lightboxVisual && renderLightbox()}
      </>
    );
  }

  function renderHeader() {
    return (
      <section className="mx-6 pt-12 pb-2 md:mx-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] italic">
            {t("visuals.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-lg opacity-60">
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
        <div
          className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-archive-ink/5"
          onClick={() => setLightboxVisual(visual)}
        >
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <span className="scale-0 text-white transition-transform group-hover:scale-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </span>
          </div>
          <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
            <button
              className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(visualId);
              }}
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
        <div
          className="cursor-pointer p-4"
          onClick={() => setLightboxVisual(visual)}
        >
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

  function renderLightbox() {
    if (!lightboxVisual) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={closeLightbox}
      >
        <div
          className="relative mx-4 flex max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-lg bg-archive-paper shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            onClick={closeLightbox}
            aria-label={t("visuals.lightbox.close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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

          <div className="flex-1 overflow-auto">
            {isImageItem(lightboxVisual) ? (
              <img
                src={lightboxVisual.url}
                alt={lightboxVisual.title || t("visuals.card.noTitle")}
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center">
                <span className="font-serif text-6xl opacity-30">
                  {lightboxVisual.content_type.startsWith("video/") ? "▶" : "📄"}
                </span>
              </div>
            )}
          </div>

          <div className="border-archive-ink/10 border-t p-6">
            <h2 className="font-serif text-2xl">
              {lightboxVisual.title || t("visuals.card.noTitle")}
            </h2>
            {lightboxVisual.description && (
              <p className="mt-2 text-sm leading-relaxed opacity-75">
                {lightboxVisual.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs opacity-50">
              <span className="capitalize">
                {t(
                  `visuals.types.${lightboxVisual.visual_type}`,
                  lightboxVisual.visual_type ?? ""
                )}
              </span>
              <span>
                {new Date(lightboxVisual.uploaded_at).toLocaleDateString(
                  i18n.resolvedLanguage === "nl" ? "nl-BE" : "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return renderMain();
}
