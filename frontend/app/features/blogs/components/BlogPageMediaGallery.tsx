import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";

import { getMediaForBlog, deleteMediaForBlog, uploadMediaForBlog } from "~/features/blogs/services/mediaService";

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

function getMediaNumericIdFromUrl(idUrl: string): number | undefined {
  const match = idUrl.match(/\/media\/(\d+)(?:[/?#]|$)/);
  if (!match) return undefined;
  const parsedId = Number(match[1]);
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : undefined;
}

type BlogPageMediaGalleryProps = {
  contentHtml: string;
  title: string;
  blog_id_url: string;
  isEditing: boolean;
};

export function BlogPageMediaGallery({
  contentHtml,
  title,
  blog_id_url,
  isEditing,
}: BlogPageMediaGalleryProps) {
  const { t } = useTranslation();
  const [mediaImageUrls, setMediaImageUrls] = useState<string[]>([]);
  // Maps image url -> media id_url, only populated in editing mode
  const [mediaIdUrlByImageUrl, setMediaIdUrlByImageUrl] = useState<Record<string, string>>({});
  const [confirmDeleteImageUrl, setConfirmDeleteImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const evidenceTrackRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const blogNumericId = useMemo(
    () => getBlogNumericIdFromUrl(blog_id_url),
    [blog_id_url]
  );

  useEffect(() => {
    if (!blogNumericId || !isEditing) return;

    let isCancelled = false;

    const loadAllMediaImages = async () => {
      try {
        const imageUrlsSet = new Set<string>();
        const idUrlMap: Record<string, string> = {};
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

    return () => {
      isCancelled = true;
    };
  }, [blogNumericId, isEditing]);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !blogNumericId) return;

    setIsUploading(true);
    try {
      const newMedia = await uploadMediaForBlog(blogNumericId, file);
      setMediaImageUrls((prev) => [...prev, newMedia.url]);
      setMediaIdUrlByImageUrl((prev) => ({ ...prev, [newMedia.url]: newMedia.id_url }));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteImageUrl === null || !blogNumericId) return;

    const mediaIdUrl = mediaIdUrlByImageUrl[confirmDeleteImageUrl];
    const mediaNumericId = mediaIdUrl ? getMediaNumericIdFromUrl(mediaIdUrl) : undefined;
    if (mediaNumericId === undefined) return;

    setIsDeleting(true);
    try {
      await deleteMediaForBlog(blogNumericId, mediaNumericId);
      setMediaImageUrls((prev) => prev.filter((url) => url !== confirmDeleteImageUrl));
      setMediaIdUrlByImageUrl(({ [confirmDeleteImageUrl]: _, ...rest }) => rest);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteImageUrl(null);
    }
  };

  return (
    <>
      <section
        id="blog-media-gallery"
        className="mt-16 border-t border-[color:color-mix(in_srgb,var(--archive-accent)_14%,transparent)] pt-14"
      >
        <div className="mb-8 flex items-end justify-between gap-6">
          <h3 className="font-serif text-4xl italic opacity-85 md:text-6xl">
            {t("blogs.contentPage.media")}
          </h3>

          {isEditing && (
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-lg border border-[color:color-mix(in_srgb,var(--archive-accent)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--archive-accent)_8%,transparent)] px-3 py-1.5 text-sm font-medium opacity-80 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {t("blogs.contentPage.uploading", "Uploading…")}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t("blogs.contentPage.uploadImage", "Upload image")}
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div
          ref={evidenceTrackRef}
          className="flex cursor-default gap-4 overflow-x-auto pb-3 select-none [scrollbar-width:thin]"
        >
          {imageUrls.map((url, index) => (
            <figure
              key={`${url}-${index}`}
              className="group bg-archive-surface relative min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] sm:min-w-[320px] lg:min-w-[340px]"
            >
              <img
                src={url}
                alt={t("blogs.contentPage.archivePhotoAlt", { title, index: index + 1 })}
                loading="lazy"
                className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />

              {isEditing && mediaIdUrlByImageUrl[url] !== undefined && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteImageUrl(url)}
                  aria-label={t("blogs.contentPage.deleteImage", "Delete image")}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-red-600/80 group-hover:opacity-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              {t("blogs.contentPage.deleteConfirmTitle", "Delete image?")}
            </h4>
            <p className="mb-6 text-sm opacity-60">
              {t("blogs.contentPage.deleteConfirmBody", "This action cannot be undone.")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteImageUrl(null)}
                disabled={isDeleting}
                className="rounded-lg px-4 py-2 text-sm font-medium opacity-60 transition hover:opacity-100 disabled:cursor-not-allowed"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {t("common.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
