import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";

import { getMediaForProduction } from "~/features/archive/services/mediaService";

// extract numeric production id from id_url for media requests
function getProductionNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/productions\/(\d+)(?:[/?#]|$)/);
  if (!match) {
    return undefined;
  }

  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

type MediaGalleryProps = {
  production_id_url: string;
  title: string;
};
export function ProductionPageMediaGallery({
  production_id_url,
  title,
}: MediaGalleryProps) {
  const { t } = useTranslation();
  const [mediaImageUrlsByProductionId, setMediaImageUrlsByProductionId] = useState<
    Record<string, string[]>
  >({});

  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);

  const imageUrls = useMemo(
    () =>
      (mediaImageUrlsByProductionId[production_id_url] ?? []).length > 0
        ? mediaImageUrlsByProductionId[production_id_url]!
        : [
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
            fallbackImageUrl,
          ],
    [fallbackImageUrl, mediaImageUrlsByProductionId, production_id_url]
  );

  const productionNumericId = useMemo(
    () => getProductionNumericIdFromUrl(production_id_url),
    [production_id_url]
  );

  useEffect(() => {
    // skip media fetching if the production id cannot be parsed
    if (!productionNumericId) {
      return;
    }

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const imageUrlsSet = new Set<string>();
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
          }

          cursor = response.pagination.next_cursor;
          hasMore =
            response.pagination.has_more &&
            response.pagination.next_cursor !== undefined;
        }

        if (!isCancelled) {
          setMediaImageUrlsByProductionId((previousState) => ({
            ...previousState,
            [production_id_url]: Array.from(imageUrlsSet),
          }));
        }
      } catch {
        if (!isCancelled) {
          setMediaImageUrlsByProductionId((previousState) => ({
            ...previousState,
            [production_id_url]: [],
          }));
        }
      }
    };

    void loadAllMediaImages();

    // prevent state updates if the component unmounts during an in-flight request
    return () => {
      isCancelled = true;
    };
  }, [production_id_url, productionNumericId]);

  useEffect(() => {
    const track = evidenceTrackRef.current;
    if (!track) {
      return;
    }
  }, [imageUrls]);

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

      <>
        <div
          ref={evidenceTrackRef}
          className={`flex gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin] ${"cursor-default"}`}
        >
          {imageUrls.map((url, index) => (
            <figure
              key={`${production_id_url}-${url}-${index}`}
              className="group bg-archive-surface min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
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
            </figure>
          ))}
        </div>
      </>
    </section>
  );
}
