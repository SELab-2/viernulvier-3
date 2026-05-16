import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  getVisuals,
  getVisualTypes,
  uploadVisual,
  deleteVisual,
  isImageItem,
  isVideoItem,
  isPdfItem,
} from "~/features/visuals/services/visualService";
import type { VisualItem, VisualType } from "~/features/visuals/types/visualTypes";
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
  const [lightboxVisual, setLightboxVisual] = useState<VisualItem | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

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
        setErrorMessage(error instanceof Error ? error.message : t("visuals.error"));
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
      const lastId = Number(visuals[visuals.length - 1].id_url.split("/").pop());
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

  function renderMain() {
    return (
      <>
        <title>{`${t("nav.visuals")} | VIERNULVIER`}</title>
        {renderHeader()}
        {renderContentSection()}
        {lightboxVisual && renderLightbox()}
        {isUploadDialogOpen && (
          <UploadDialog
            visualTypes={visualTypes}
            onClose={() => setIsUploadDialogOpen(false)}
            onUploaded={(item) => {
              if (!selectedType || item.visual_type === selectedType) {
                setVisuals((prev) => [item, ...prev]);
              }
              setTotalCount((prev) => prev + 1);
            }}
          />
        )}
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
          <p className="mt-2 max-w-2xl text-lg opacity-60">{t("visuals.subtitle")}</p>
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
            <button
              className="bg-archive-accent hover:bg-archive-accent/90 rounded px-4 py-2 text-sm font-medium text-white transition-colors"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              {t("visuals.upload.button")}
            </button>
          </Protected>
        </div>
      </div>
    );
  }

  function renderLoadingState() {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-serif text-3xl italic opacity-60">{t("visuals.loading")}</p>
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
        <p className="mt-3 max-w-2xl opacity-70">{t("visuals.empty.description")}</p>
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
          className="bg-archive-ink/5 relative aspect-[4/3] cursor-pointer overflow-hidden"
          onClick={() => setLightboxVisual(visual)}
        >
          {isImageItem(visual) ? (
            <img
              src={visual.url}
              alt={visual.title || t("visuals.card.noTitle")}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : isVideoItem(visual) ? (
            <video
              src={visual.url}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              muted
              preload="metadata"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-serif text-4xl opacity-20">📄</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <span className="scale-0 text-white transition-transform group-hover:scale-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </span>
          </div>
          <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
            <button
              className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
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
        <div className="cursor-pointer p-4" onClick={() => setLightboxVisual(visual)}>
          <h3 className="font-serif text-lg">
            {visual.title || t("visuals.card.noTitle")}
          </h3>
          {visual.description && (
            <p className="mt-1 line-clamp-2 text-sm opacity-70">{visual.description}</p>
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
          className="bg-archive-paper relative mx-4 flex max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-lg shadow-2xl"
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
            ) : isVideoItem(lightboxVisual) ? (
              <video
                src={lightboxVisual.url}
                className="max-h-[70vh] w-full"
                controls
                autoPlay
              />
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center">
                <span className="font-serif text-6xl opacity-30">📄</span>
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
            <div className="mt-3 flex items-center justify-between text-xs opacity-50">
              <div className="flex items-center gap-4">
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
              <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-red-400 opacity-100 transition-colors hover:text-red-800"
                  onClick={() => {
                    const visualId = Number(lightboxVisual.id_url.split("/").pop());
                    handleDelete(visualId);
                    closeLightbox();
                  }}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {t("visuals.delete")}
                </button>
              </Protected>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return renderMain();
}

function UploadDialog({
  visualTypes,
  onClose,
  onUploaded,
}: {
  visualTypes: VisualType[];
  onClose: () => void;
  onUploaded: (item: VisualItem) => void;
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visualType, setVisualType] = useState<VisualType>("other");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (
      selected &&
      (selected.type.startsWith("image/") || selected.type.startsWith("video/"))
    ) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0] ?? null;
    setFile(dropped);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (
      dropped &&
      (dropped.type.startsWith("image/") || dropped.type.startsWith("video/"))
    ) {
      setPreviewUrl(URL.createObjectURL(dropped));
    } else {
      setPreviewUrl(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleSubmit() {
    if (!file) return;

    setIsUploading(true);
    try {
      const created = await uploadVisual(file, {
        title: title || undefined,
        description: description || undefined,
        visual_type: visualType || undefined,
      });
      onUploaded(created);
      onClose();
    } catch (error) {
      window.alert(
        t("visuals.messages.uploadFailed", {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      setIsUploading(false);
    }
  }

  const canSubmit = file !== null && title.trim() !== "" && !isUploading;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-archive-paper mx-4 w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-archive-ink/10 flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-serif text-xl">{t("visuals.upload.dialogTitle")}</h2>
          <button
            className="hover:bg-archive-ink/10 rounded-full p-1 transition-colors"
            onClick={onClose}
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
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div
            className={`border-archive-ink/20 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              file
                ? "border-archive-accent bg-archive-accent/5"
                : "hover:border-archive-accent/50 hover:bg-archive-ink/5"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {previewUrl && file?.type.startsWith("image/") ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 rounded object-contain"
              />
            ) : previewUrl && file?.type.startsWith("video/") ? (
              <video
                src={previewUrl}
                className="max-h-48 rounded object-contain"
                muted
                preload="metadata"
              />
            ) : file ? (
              <div className="flex items-center gap-2">
                <span className="font-serif text-3xl opacity-20">📄</span>
                <span className="text-sm opacity-60">{file.name}</span>
              </div>
            ) : (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-10 w-10 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm opacity-50">
                  {t("visuals.upload.dropOrBrowse")}
                </p>
                <p className="mt-1 text-xs opacity-30">
                  {t("visuals.upload.acceptedFormats")}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("visuals.upload.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("visuals.upload.titlePlaceholder")}
              className="bg-archive-surface border-archive-ink/20 w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("visuals.upload.descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("visuals.upload.descriptionPlaceholder")}
              rows={4}
              className="bg-archive-surface border-archive-ink/20 w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("visuals.upload.typeLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {visualTypes.map((type) => (
                <button
                  key={type}
                  className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    visualType === type
                      ? "bg-archive-accent text-white"
                      : "bg-archive-ink/10 hover:bg-archive-ink/20"
                  }`}
                  onClick={() => setVisualType(type)}
                >
                  {t(`visuals.types.${type}`, type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-archive-ink/10 flex justify-end gap-3 border-t px-6 py-4">
          <button
            className="hover:bg-archive-ink/10 rounded px-4 py-2 text-sm font-medium transition-colors"
            onClick={onClose}
          >
            {t("visuals.upload.cancel")}
          </button>
          <button
            className="bg-archive-accent hover:bg-archive-accent/90 rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isUploading ? t("visuals.upload.uploading") : t("visuals.upload.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
