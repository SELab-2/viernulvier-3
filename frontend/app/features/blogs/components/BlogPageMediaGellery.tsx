import { useTranslation } from "react-i18next";
import { useMemo, useRef } from "react";

const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

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

type BlogPageMediaGalleryProps = {
  contentHtml: string;
  title: string;
};

export function BlogPageMediaGallery({
  contentHtml,
  title,
}: BlogPageMediaGalleryProps) {
  const { t } = useTranslation();
  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);

  const imageUrls = useMemo(() => {
    const extracted = extractImageSrcs(contentHtml);
    // TODO: remove fallback array before production — mirrors ProductionPageMediaGallery placeholder behaviour
    return extracted.length > 0
      ? extracted
      : [
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
          FALLBACK_IMAGE_URL,
        ];
  }, [contentHtml]);

  return (
    <section
      id="blog-media-gallery"
      className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14"
    >
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="font-serif text-4xl italic opacity-85 md:text-6xl">
          {t("blogPage.visualEvidence", "Visual evidence")}
        </h2>
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
              alt={t("blogPage.archivePhotoAlt", { title, index: index + 1 })}
              loading="lazy"
              className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
