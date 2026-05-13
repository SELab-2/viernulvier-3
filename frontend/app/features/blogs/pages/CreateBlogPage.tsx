import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import SearchIcon from "@mui/icons-material/Search";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";
import ComplexEditableField from "~/shared/components/ComplexEditableField";
import { BLOG_PERMISSIONS } from "../blog.constants";

function BackToArchiveLink() {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  return (
    <Link
      to={lp("/blogs")}
      className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
    >
      {t("blogs.createBlogPage.backToBlogs")}
    </Link>
  );
}

type MediaPreview = { src: string; isVideo: boolean };

function MediaUploadWidget() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPreviews = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .map((f) => ({
        src: URL.createObjectURL(f),
        isVideo: f.type.startsWith("video/"),
      }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-archive-ink/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("blogs.createBlogPage.media.title")}
        </h3>
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
        } `}
      >
        <PermMediaOutlinedIcon
          className="text-archive-ink/40"
          style={{ fontSize: 36 }}
        />
        <p className="text-archive-ink/60 text-center text-sm leading-snug">
          {t("blogs.createBlogPage.media.dropMedia")}{" "}
          <span className="text-archive-accent font-semibold underline">
            {t("blogs.createBlogPage.media.browse")}
          </span>
        </p>
        <p className="text-archive-ink/35 text-xs">
          {t("blogs.createBlogPage.media.acceptedFileFormats")}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((item, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl bg-black"
            >
              {item.isVideo ? (
                <video
                  src={item.src}
                  className="h-full w-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={item.src}
                  alt=""
                  className="h-full w-full object-cover transition hover:scale-105"
                />
              )}
              <Tooltip title={t("blogs.createBlogPage.remove")}>
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

function SeriesSearchBar() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <div className="mt-2">
      <div className="mb-2">
        <h3 className="text-archive-ink/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("blogs.createBlogPage.series.title")}
        </h3>
      </div>

      <div className="relative flex items-center">
        <SearchIcon
          className="text-archive-ink/40 absolute left-3"
          style={{ fontSize: 18 }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("blogs.createBlogPage.series.searchSeries")}
          className={`bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border py-2 pr-4 pl-9 text-sm transition focus:ring-4 focus:outline-none`}
        />
        {query && (
          <IconButton
            size="small"
            onClick={() => setQuery("")}
            className="!absolute !right-2"
          >
            <CloseIcon style={{ fontSize: 14 }} />
          </IconButton>
        )}
      </div>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-archive-ink/5 border-archive-ink/5 rounded-2xl border p-4 backdrop-blur-md transition md:p-6">
      {children}
    </div>
  );
}

export function CreateBlogPage() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  const isTitleEmpty = title.trim() === "";
  const canSave = !isTitleEmpty && !isEditing && !isSaving;

  const saveTooltip = isTitleEmpty
    ? t("blogs.createBlogPage.save.saveDisabledReasonTitle")
    : isEditing
      ? t("blogs.createBlogPage.save.saveDisabledReasonEditing")
      : "";

  function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  }

  return (
    <>
      <title>{`${t("nav.blogs_create")} | VIERNULVIER`}</title>
      <div className="bg-archive-paper text-archive-ink min-h-screen">
        {isSaving && (
          <LinearProgress
            className="!fixed !top-0 !left-0 !z-50 !w-full"
            color="inherit"
          />
        )}

        <main className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 pt-10 pb-24 md:px-12">
          <BackToArchiveLink />

          <div className="mb-2">
            <h1 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
              {t("blogs.createBlogPage.heading")}
            </h1>
          </div>

          <SectionCard>
            <h3 className="text-archive-ink/70 mb-3 text-xs font-bold tracking-[0.2em] uppercase">
              {t("blogs.createBlogPage.title.title")}
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            </h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("blogs.createBlogPage.title.placeholder")}
              className={`bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border px-3 py-2 text-sm transition focus:ring-4 focus:outline-none`}
            />
          </SectionCard>

          <SectionCard>
            <h3 className="text-archive-ink/70 mb-3 text-xs font-bold tracking-[0.2em] uppercase">
              {t("blogs.createBlogPage.content.title")}
            </h3>
            <ComplexEditableField
              id="content"
              field={t("blogs.createBlogPage.content.field")}
              html={contentHtml}
              isEditing={isEditing}
              onStartEdit={() => setIsEditing(true)}
              onSave={(html) => {
                setContentHtml(html);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
              canEdit={true}
              permissions={[BLOG_PERMISSIONS.update]}
            />
          </SectionCard>

          <SectionCard>
            <MediaUploadWidget />
          </SectionCard>

          <SectionCard>
            <SeriesSearchBar />
          </SectionCard>
        </main>

        <div className="fixed right-6 bottom-6 z-50">
          <Tooltip title={saveTooltip}>
            <span>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`bg-archive-accent text-archive-paper flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`}
              >
                <SaveOutlinedIcon style={{ fontSize: 18 }} />
                {isSaving
                  ? t("blogs.createBlogPage.save.saving")
                  : t("blogs.createBlogPage.save.save")}
              </button>
            </span>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

export function CreateBlogAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("blogs.createBlogPage.accessDenied.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">
          {t("blogs.createBlogPage.accessDenied.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-70">
          {t("blogs.createBlogPage.accessDenied.description")}
        </p>
      </div>
    </section>
  );
}
