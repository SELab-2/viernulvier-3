import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import CloseIcon from "@mui/icons-material/Close";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

type MediaPreview = { src: string; file: File };

export type MediaUploadWidgetProps = {
  onFilesChange: (files: File[]) => void;
  onBannerUrlChange: (url: string | undefined) => void;
};

/**
 * Files are held in browser memory only. `onFilesChange` is called with the
 * full ordered list every time it changes. The banner (first file) is tracked
 * with a star toggle — selecting a new banner moves that file to index 0 while
 * keeping the relative order of the rest.
 */
export function MediaUploadWidget({
  onFilesChange,
  onBannerUrlChange,
}: MediaUploadWidgetProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function notify(updated: MediaPreview[]) {
    onFilesChange(updated.map((p) => p.file));
    onBannerUrlChange(updated[0]?.src);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files)
      .filter((f) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
      )
      .map((f) => ({
        src: URL.createObjectURL(f),
        file: f,
      }));
    setPreviews((prev) => {
      const updated = [...prev, ...incoming];
      notify(updated);
      return updated;
    });
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index].src);
      const updated = prev.filter((_, i) => i !== index);
      notify(updated);
      return updated;
    });
  }

  /** Move the chosen item to position 0 (banner slot). */
  function setBanner(index: number) {
    if (index === 0) return;
    setPreviews((prev) => {
      const updated = [prev[index], ...prev.filter((_, i) => i !== index)];
      notify(updated);
      return updated;
    });
  }

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-archive-ink/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("archive.media.title")}
        </h3>
        {previews.length > 0 && (
          <p className="text-archive-ink/40 text-xs">{t("archive.media.bannerHint")}</p>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 transition ${
          isDragging
            ? "border-archive-accent bg-archive-accent/10"
            : "border-archive-ink/15 hover:border-archive-accent/60 bg-archive-ink/3"
        }`}
      >
        <PermMediaOutlinedIcon
          className="text-archive-ink/40"
          style={{ fontSize: 36 }}
        />
        <p className="text-archive-ink/60 text-center text-sm leading-snug">
          {t("archive.media.dropMedia")}{" "}
          <span className="text-archive-accent font-semibold underline">
            {t("archive.media.browse")}
          </span>
        </p>
        <p className="text-archive-ink/35 text-xs">
          {t("archive.media.acceptedFormats")} {/* JPEG, PNG, WebP, GIF */}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((item, i) => (
            <div
              key={item.src}
              className={`relative aspect-square overflow-hidden rounded-xl bg-black ${
                i === 0 ? "ring-archive-accent ring-2" : ""
              }`}
            >
              <img
                src={item.src}
                alt=""
                className="h-full w-full object-cover transition hover:scale-105"
              />

              {/* Banner toggle */}
              <Tooltip
                title={
                  i === 0 ? t("archive.media.isBanner") : t("archive.media.setBanner")
                }
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBanner(i);
                  }}
                  className="!absolute !bottom-1 !left-1 !bg-black/50 !text-yellow-400 hover:!bg-black/70"
                >
                  {i === 0 ? (
                    <StarIcon style={{ fontSize: 14 }} />
                  ) : (
                    <StarBorderIcon style={{ fontSize: 14 }} />
                  )}
                </IconButton>
              </Tooltip>

              {/* Remove */}
              <Tooltip title={t("archive.media.remove")}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview(i);
                  }}
                  className="!absolute !top-1 !right-1 !bg-black/50 !text-white hover:!bg-black/70"
                >
                  <CloseIcon style={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
