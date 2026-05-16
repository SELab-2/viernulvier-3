import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";

import { getMediaForBlog } from "~/features/blogs/services/mediaService";

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit/crop";

function extractImageSrcs(html: string): string[] {
  const imgRegex = /<img[^>]*\/?>/gi;
  const srcRegex = /src="([^"]+)"/i;
  const srcs: string[] = [];
  for (const match of html.matchAll(imgRegex)) {
    const srcMatch = match[0].match(srcRegex);
    if (srcMatch?.[1]) srcs.push(srcMatch[1]);
  }
  return srcs;
}

function getBlogNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/blogs\/(\d+)(?:[/?#]|$)/);
  if (!match) return undefined;
  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

type BlogPageMediaGalleryProps = {
  contentHtml: string;
  title: string;
  blog_id_url: string;
};

export function BlogPageMediaGallery({
  contentHtml,
  title,
  blog_id_url,
}: BlogPageMediaGalleryProps) {
  const { t } = useTranslation();
  const [mediaImageUrls, setMediaImageUrls] = useState<string[]>([]);
  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);

  const blogNumericId = useMemo(
    () => getBlogNumericIdFromUrl(blog_id_url),
    [blog_id_url]
  );

  useEffect(() => {
    if (!blogNumericId) return;

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const imageUrlsSet = new Set<string>();
        let cursor: number | undefined;
        let hasMore = true;

        while (hasMore) {
          const response = await getMediaForBlog(blogNumericId, {
            cursor,
            limit: 50,
          });

          for (const media of response.media) {
            if (!media.content_type.startsWith("image/")) {
              continue;
            }

            imageUrlsSet.add(media.url);
          }

          cursor = response.pagination.next_cursor;
          hasMore =
            response.pagination.has_more &&
            response.pagination.next_cursor !== undefined;
        }

        if (!isCancelled) {
          setMediaImageUrls(Array.from(imageUrlsSet));
        }
      } catch {
        if (!isCancelled) {
          setMediaImageUrls([]);
        }
      }
    };

    void loadAllMediaImages();

    return () => {
      isCancelled = true;
    };
  }, [blogNumericId]);

  const contentImageUrls = useMemo(() => extractImageSrcs(contentHtml), [contentHtml]);

  const imageUrls = useMemo(() => {
    const allUrls = [...mediaImageUrls, ...contentImageUrls];
    const seen = new Set<string>();
    const unique = allUrls.filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
    return unique.length > 0
      ? unique
      : [
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
        ];
  }, [mediaImageUrls, contentImageUrls]);

  return (
    <section
      id="blog-media-gallery"
      className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14"
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <h3 className="font-serif text-4xl italic opacity-85 md:text-6xl">
          {t("blogs.contentPage.media")}
        </h3>
      </div>

      <div
        ref={evidenceTrackRef}
        className="flex cursor-default gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin]"
      >
        {imageUrls.map((url, index) => (
          <figure
            key={`${url}-${index}`}
            className="group bg-archive-surface min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
          >
            <img
              src={url}
              alt={t("blogs.contentPage.archivePhotoAlt", { title, index: index + 1 })}
              loading="lazy"
              className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
