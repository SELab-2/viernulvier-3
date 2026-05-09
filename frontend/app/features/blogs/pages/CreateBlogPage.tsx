import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { ArchiveTextField } from "~/shared/components/ArchiveTextField";
import ComplexEditableField from "~/shared/components/ArchiveRichTextFieldWrapper";
import SearchIcon from "@mui/icons-material/Search";
import InsertPhotoOutlinedIcon from "@mui/icons-material/InsertPhotoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import LinearProgress from "@mui/material/LinearProgress";

function BackToArchiveLink() {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  return (
    <Link
      to={lp("/archive")}
      className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
    >
      {t("createBlogPage.backToArchive")}
    </Link>
  );
}

function ImageUploadWidget() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const urls = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-archive-ink/70 dark:text-archive-paper/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("createBlogPage.images")}
        </h3>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed
          px-6 py-8 transition
          ${isDragging
            ? "border-archive-accent bg-archive-accent/10"
            : "border-archive-ink/15 dark:border-archive-paper/15 hover:border-archive-accent/60 bg-archive-ink/3 dark:bg-archive-paper/3"}
        `}
      >
        <InsertPhotoOutlinedIcon
          className="text-archive-ink/40 dark:text-archive-paper/40"
          style={{ fontSize: 36 }}
        />
        <p className="text-archive-ink/60 dark:text-archive-paper/60 text-center text-sm leading-snug">
          {t("createBlogPage.dropImages")}{" "}
          <span className="text-archive-accent font-semibold underline">
            {t("createBlogPage.browse")}
          </span>
        </p>
        <p className="text-archive-ink/35 dark:text-archive-paper/35 text-xs">
		  {t("createBlogPage.acceptedImageFormats")}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover transition hover:scale-105"
              />
              <Tooltip title={t("createBlogPage.remove")}>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                  className="!absolute !right-1 !top-1 !bg-black/50 !text-white hover:!bg-black/70"
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
        <h3 className="text-archive-ink/70 dark:text-archive-paper/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("createBlogPage.tags")}
        </h3>
      </div>

      <div className="relative flex items-center">
        <SearchIcon
          className="text-archive-ink/40 dark:text-archive-paper/40 absolute left-3"
          style={{ fontSize: 18 }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("createBlogPage.searchTags")}
          className={`
            bg-archive-paper border-archive-ink/10 dark:bg-archive-ink/5 dark:border-archive-paper/10
            focus:ring-archive-accent/40 focus:border-archive-accent
            w-full rounded-lg border py-2 pl-9 pr-4 text-sm
            focus:ring-4 focus:outline-none transition
          `}
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
    <div className="bg-archive-ink/5 rounded-2xl border border-archive-ink/5 p-4 backdrop-blur-md transition md:p-6">
      {children}
    </div>
  );
}

export function CreateBlogPage() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [isEditing, setIsEditing] = useState(true);

  function handleSave() {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  }

  return (
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
          <p className="text-[0.68rem] tracking-[0.24em] uppercase opacity-50">
            {t("createBlogPage.new")}
          </p>
          <h1 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
            {t("createBlogPage.heading")}
          </h1>
        </div>

        <SectionCard>
          <h3 className="text-archive-ink/70 dark:text-archive-paper/70 mb-3 text-xs font-bold tracking-[0.2em] uppercase">
            {t("createBlogPage.title")}
          </h3>
          <ArchiveTextField label={t("createBlogPage.titlePlaceholder")} />
        </SectionCard>

        <SectionCard>
          <h3 className="text-archive-ink/70 dark:text-archive-paper/70 mb-3 text-xs font-bold tracking-[0.2em] uppercase">
            {t("createBlogPage.content")}
          </h3>
          <ComplexEditableField
            id="content"
            field="content"
            html={contentHtml}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onSave={(html) => {
              setContentHtml(html);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
			fallback={<p className="opacity-75">{t("createBlogPage.fallback")}</p>}
            canEdit={true}
          />
        </SectionCard>

        <SectionCard>
          <ImageUploadWidget />
        </SectionCard>

        <SectionCard>
          <SeriesSearchBar />
        </SectionCard>
      </main>

      <div className="fixed right-6 bottom-6 z-50">
        <Tooltip title={t("createBlogPage.save", "Save post")}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              bg-archive-accent text-archive-paper
              flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold
              shadow-lg transition hover:opacity-90 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <SaveOutlinedIcon style={{ fontSize: 18 }} />
            {isSaving
              ? t("createBlogPage.saving", "Saving…")
              : t("createBlogPage.save", "Save post")}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export function CreateBlogAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("blogs.accessDenied.eyebrow")}
        </p>
        <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">
          {t("blogs.accessDenied.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-70">
          {t("blogs.accessDenied.description")}
        </p>
      </div>
    </section>
  );
}
