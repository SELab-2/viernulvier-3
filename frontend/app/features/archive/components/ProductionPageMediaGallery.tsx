import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getMediaForProduction, deleteMedia } from "~/features/archive/services/mediaService";
import type { MediaItem } from "~/features/archive/types/mediaTypes";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

// extract numeric production id from id_url for media requests
function getProductionNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  if (!match) {
    return undefined;
  }

  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

function getMediaNumericId(idUrl: string): number {
  return Number(idUrl.split("/").pop());
}

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

type MediaGalleryProps = {
  production_id_url: string;
  title: string;
};

export function ProductionPageMediaGallery({
  production_id_url,
  title,
}: MediaGalleryProps) {
  const { t } = useTranslation();
  const [mediaByProductionId, setMediaByProductionId] = useState<
    Record<string, MediaItem[]>
  >({});
  const [lightboxMedia, setLightboxMedia] = useState<MediaItem | null>(null);

  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);

  const closeLightbox = useCallback(() => setLightboxMedia(null), []);

  // keyboard close + scroll lock for lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
    }
    if (lightboxMedia) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxMedia, closeLightbox]);

  const mediaItems = useMemo(
    () => mediaByProductionId[production_id_url] ?? [],
    [mediaByProductionId, production_id_url]
  );

  // fall back to placeholder images while real media hasn't loaded yet
  const fallbackItems: MediaItem[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id_url: `fallback-${i}`,
        url: FALLBACK_IMAGE_URL,
        content_type: "image/jpeg",
      })) as MediaItem[],
    []
  );

  const displayItems = mediaItems.length > 0 ? mediaItems : fallbackItems;

  const productionNumericId = useMemo(
    () => getProductionNumericIdFromUrl(production_id_url),
    [production_id_url]
  );

  useEffect(() => {
    if (!productionNumericId) {
      return;
    }

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const collected: MediaItem[] = [];
        const seenUrls = new Set<string>();
        let cursor: number | undefined;
        let hasMore = true;

        while (hasMore) {
          const response = await getMediaForProduction(productionNumericId, {
            cursor,
            limit: 50,
          });

          for (const media of response.media) {
            if (!media.content_type.startsWith("image/")) {
              continue;
            }
            if (!seenUrls.has(media.url)) {
              seenUrls.add(media.url);
              collected.push(media);
            }
          }

          cursor = response.pagination.next_cursor;
          hasMore =
            response.pagination.has_more &&
            response.pagination.next_cursor !== undefined;
        }

        if (!isCancelled) {
          setMediaByProductionId((prev) => ({
            ...prev,
            [production_id_url]: collected,
          }));
        }
      } catch {
        if (!isCancelled) {
          setMediaByProductionId((prev) => ({
            ...prev,
            [production_id_url]: [],
          }));
        }
      }
    };

    void loadAllMediaImages();

    return () => {
      isCancelled = true;
    };
  }, [production_id_url, productionNumericId]);

  useEffect(() => {
    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }
  }, [displayItems]);

  async function handleDelete(mediaId: number) {
    if (!productionNumericId) return;
    if (!window.confirm(t("productionPage.confirmDeleteMedia"))) return;

    try {
      await deleteMedia(productionNumericId, mediaId);
      setMediaByProductionId((prev) => ({
        ...prev,
        [production_id_url]: (prev[production_id_url] ?? []).filter(
          (m) => getMediaNumericId(m.id_url) !== mediaId
        ),
      }));
      // close lightbox if the deleted item was open
      if (lightboxMedia && getMediaNumericId(lightboxMedia.id_url) === mediaId) {
        closeLightbox();
      }
    } catch (error) {
      window.alert(
        t("productionPage.deleteMediaFailed", {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  const isFallback = mediaItems.length === 0;

  return (
    <section
      id="production-media-gallery"
      className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14"
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
          {t("productionPage.visualEvidence")}
        </h2>
      </div>

      <div
        ref={evidenceTrackRef}
        className="flex gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin] cursor-default"
      >
        {displayItems.map((item, index) => {
          const isFallbackItem = isFallback || item.id_url.startsWith("fallback-");
          const mediaId = isFallbackItem ? -1 : getMediaNumericId(item.id_url);

          return (
            <figure
              key={`${production_id_url}-${item.id_url}-${index}`}
              className="group bg-archive-surface relative min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
            >
              <div
                className={`relative overflow-hidden ${!isFallbackItem ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (!isFallbackItem) setLightboxMedia(item);
                }}
              >
                <img
                  src={item.url}
                  alt={t("productionPage.archivePhotoAlt", {
                    title,
                    index: index + 1,
                  })}
                  loading="lazy"
                  className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                {/* hover overlay with zoom icon */}
                {!isFallbackItem && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                    <span className="scale-0 text-white transition-transform group-hover:scale-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
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
                )}
                {/* delete button — top-right corner, visible on hover */}
                {!isFallbackItem && (
                  <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
                    <button
                      className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(mediaId);
                      }}
                      aria-label={t("productionPage.deleteMedia")}
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
                )}
              </div>
            </figure>
          );
        })}
      </div>

      {/* lightbox */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="bg-archive-paper relative mx-4 flex max-h-[90vh] max-w-5xl flex-col overflow-hidden rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
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

            {/* image */}
            <div className="flex-1 overflow-auto">
              <img
                src={lightboxMedia.url}
                alt={t("productionPage.archivePhotoAlt", {
                  title,
                  index: "",
                })}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>

            {/* footer with delete */}
            <div className="border-archive-ink/10 flex items-center justify-between border-t px-6 py-4">
              <h2 className="font-serif text-xl italic opacity-75">{title}</h2>
              <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-red-400 transition-colors hover:text-red-600"
                  onClick={() => {
                    void handleDelete(getMediaNumericId(lightboxMedia.id_url));
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
                  {t("productionPage.deleteMedia")}
                </button>
              </Protected>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}