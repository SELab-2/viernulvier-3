import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getMediaForProduction,
  uploadMedia,
  deleteMedia,
} from "~/features/archive/services/mediaService";

// extract numeric production id from id_url for media requests
function getProductionNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  if (!match) {
    return undefined;
  }

  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

function getMediaNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/media\/(\d+)(?:[/?#]|$)/);
  if (!match) return undefined;
  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

type MediaGalleryProps = {
  production_id_url: string;
  title: string;
  isEditing: boolean;
  setMediaEdited: React.Dispatch<React.SetStateAction<boolean>>;
};

export function ProductionPageMediaGallery({
  production_id_url,
  title,
  isEditing,
  setMediaEdited,
}: MediaGalleryProps) {
  const { t } = useTranslation();
  const [mediaImageUrls, setMediaImageUrls] = useState<string[]>([]);
  const [mediaIdUrlByImageUrl, setMediaIdUrlByImageUrl] = useState<
    Record<string, string>
  >({});
  const [confirmDeleteImageUrl, setConfirmDeleteImageUrl] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const imageUrls = mediaImageUrls;

  const productionNumericId = useMemo(
    () => getProductionNumericIdFromUrl(production_id_url),
    [production_id_url]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxImageUrl(null);
      }
    }

    if (lightboxImageUrl) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxImageUrl]);

  useEffect(() => {
    // skip media fetching if the production id cannot be parsed
    if (!productionNumericId) {
      return;
    }

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const imageUrlsSet = new Set<string>();
        const idUrlMap: Record<string, string> = {};
        let cursor: number | undefined;
        let hasMore = true;

        // continue paginated requests until there are no more pages
        while (hasMore) {
          const response = await getMediaForProduction(productionNumericId, {
            cursor,
            limit: 50,
          });

          for (const media of response.media) {
            // keep only image media for the visual evidence section
            if (!media.content_type.startsWith("image/")) {
              continue;
            }

            // a set avoids duplicate urls while preserving insertion order
            imageUrlsSet.add(media.url);
            idUrlMap[media.url] = media.id_url;
          }

          cursor = response.pagination.next_cursor;
          hasMore =
            response.pagination.has_more &&
            response.pagination.next_cursor !== undefined;
        }

        if (!isCancelled) {
          setMediaImageUrls(Array.from(imageUrlsSet));
          setMediaIdUrlByImageUrl(idUrlMap);
        }
      } catch {
        if (!isCancelled) {
          setMediaImageUrls([]);
          setMediaIdUrlByImageUrl({});
        }
      }
    };

    void loadAllMediaImages();

    // prevent state updates if the component unmounts during an in-flight request
    return () => {
      isCancelled = true;
    };
  }, [productionNumericId, isEditing]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productionNumericId) return;

    setIsUploading(true);
    try {
      const newMedia = await uploadMedia(productionNumericId, file);
      setMediaImageUrls((prev) => [...prev, newMedia.url]);
      setMediaIdUrlByImageUrl((prev) => ({ ...prev, [newMedia.url]: newMedia.id_url }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMediaEdited(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteImageUrl === null || !productionNumericId) return;

    const mediaIdUrl = mediaIdUrlByImageUrl[confirmDeleteImageUrl];
    const mediaNumericId = mediaIdUrl
      ? getMediaNumericIdFromUrl(mediaIdUrl)
      : undefined;
    if (mediaNumericId === undefined) return;

    setIsDeleting(true);
    try {
      await deleteMedia(productionNumericId, mediaNumericId);
      setMediaImageUrls((prev) => prev.filter((url) => url !== confirmDeleteImageUrl));
      setMediaIdUrlByImageUrl((prev) => {
        const next = { ...prev };
        delete next[confirmDeleteImageUrl];
        return next;
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteImageUrl(null);
      setMediaEdited(true);
    }
  };

  useEffect(() => {
    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }
  }, [imageUrls]);

  return (
    <>
      <section
        id="production-media-gallery"
        className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14"
      >
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
            {t("productionPage.visualEvidence")}
          </h2>

          {isEditing && (
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--archive-accent)_8%,transparent)] px-3 py-1.5 text-sm font-medium opacity-80 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {t("productionPage.uploading")}
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t("productionPage.uploadMedia")}
                </>
              )}
            </button>
          )}
        </div>

        {/* hidden inputfield to have cleaner file selection ui */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {imageUrls.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--archive-accent)_3%,transparent)] px-6 py-10 text-center">
            <p className="font-serif text-2xl italic opacity-60">
              {t("productionPage.noImagesYet")}
            </p>
          </div>
        ) : (
          <div
            ref={evidenceTrackRef}
            className="flex cursor-default gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin]"
          >
            {imageUrls.map((url, index) => (
              <figure
                key={`${production_id_url}-${url}-${index}`}
                onClick={() => setLightboxImageUrl(url)}
                className="group bg-archive-surface relative min-w-[260px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
              >
                <img
                  src={url}
                  alt={t("productionPage.archivePhotoAlt", {
                    title,
                    index: index + 1,
                  })}
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />

                {isEditing && mediaIdUrlByImageUrl[url] !== undefined && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteImageUrl(url);
                    }}
                    aria-label={t("productionPage.deleteMedia")}
                    className="absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600/80"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      {confirmDeleteImageUrl !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-archive-surface mx-4 w-full max-w-sm rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_16%,transparent)] p-6 shadow-xl">
            <h4 id="delete-dialog-title" className="mb-2 font-serif text-xl">
              {t("productionPage.edit.confirmDeleteTitle")}
            </h4>
            <p className="mb-6 text-sm opacity-60">
              {t("productionPage.edit.confirmDeleteBody")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteImageUrl(null)}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed"
              >
                {t("productionPage.edit.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {t("productionPage.edit.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="relative mx-4 max-h-[90vh] max-w-6xl overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImageUrl(null)}
              aria-label={t("productionPage.closeLightbox")}
              className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
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

            <img
              src={lightboxImageUrl}
              alt={t("productionPage.archivePhoto")}
              className="max-h-[90vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
