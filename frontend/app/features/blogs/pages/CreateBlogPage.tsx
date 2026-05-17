import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router";
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
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import { getAllProductionGroups } from "~/features/archive/services/productionGroupService";
import type { Blog, BlogCreate } from "../types/blogTypes";
import { createBlog } from "../services/blogService";
import { uploadMediaForBlog } from "../services/mediaService";
import { useUnsavedChangesBlocker } from "~/features/archive/utils/productionPageFunctions";

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

type MediaPreview = { src: string; isVideo: boolean; file: File };

type MediaUploadWidgetProps = {
  onFilesChange: (files: File[]) => void;
};

function MediaUploadWidget({ onFilesChange }: MediaUploadWidgetProps) {
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
        file: f,
      }));
    setPreviews((prev) => {
      const updated = [...prev, ...newPreviews];
      onFilesChange(updated.map((p) => p.file));
      return updated;
    });
  }

  function removePreview(index: number) {
    setPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      onFilesChange(updated.map((p) => p.file));
      return updated;
    });
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

type SeriesSearchBarProps = {
  productionGroup: ProductionGroup | null;
  setProductionGroup: React.Dispatch<React.SetStateAction<ProductionGroup | null>>;
};

function SeriesSearchBar({
  productionGroup,
  setProductionGroup,
}: SeriesSearchBarProps) {
  const [allProductionGroups, setAllProductionGroups] = useState<ProductionGroup[]>([]);
  const [selectedProductionGroup, setSelectedProductionGroup] =
    useState<ProductionGroup | null>(null);
  const [groupQuery, setGroupQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    async function loadAllGroups() {
      try {
        const groups = await getAllProductionGroups();
        if (!cancelled) {
          setAllProductionGroups(groups);
          const current =
            groups.find((g) => g.id_url === productionGroup?.id_url) ?? null;
          setSelectedProductionGroup(current);
        }
      } catch {
        if (!cancelled) setAllProductionGroups([]);
      }
    }
    void loadAllGroups();
    return () => {
      cancelled = true;
    };
  }, [productionGroup]);

  function normalizeProductionGroupText(value: string): string {
    return (
      value
        // Split accented characters into their base letter and combining marks.
        .normalize("NFKD")
        // Drop the combining marks so query values stay ASCII-only.
        .replace(/[\u0300-\u036f]/g, "")
        // Make matching case-insensitive and remove accidental surrounding spaces.
        .toLowerCase()
        .trim()
    );
  }

  function matchesProductionGroupQuery(
    productionGroup: ProductionGroup,
    query: string
  ): boolean {
    const normalizedQuery = normalizeProductionGroupText(query);

    return normalizeProductionGroupText(productionGroup.title).includes(
      normalizedQuery
    );
  }

  const filteredProductionGroups =
    groupQuery.trim().length > 0
      ? allProductionGroups.filter((pg) => matchesProductionGroupQuery(pg, groupQuery))
      : allProductionGroups;

  const selectGroup = (pg: ProductionGroup) => {
    setSelectedProductionGroup(pg);
    setProductionGroup(pg);
    setGroupQuery("");
  };

  return (
    <div className="mt-2">
      <div className="mb-2">
        <h3 className="text-archive-ink/70 text-xs font-bold tracking-[0.2em] uppercase">
          {t("blogs.createBlogPage.series.title")}
        </h3>
      </div>

      <div className="space-y-3" style={{ maxWidth: "min(25%, 280px)" }}>
        {selectedProductionGroup && (
          <button
            onClick={() => {
              setSelectedProductionGroup(null);
              setProductionGroup(null);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-current/20 bg-white/5 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-white/10"
          >
            <span>{selectedProductionGroup.title}</span>
            <span className="text-xs opacity-40">✕</span>
          </button>
        )}
        <div className="relative">
          <input
            type="text"
            placeholder={t("blogs.createBlogPage.series.searchSeries")}
            className="w-full rounded-lg border border-current/20 bg-white/5 px-3 py-2 pr-8 text-sm transition-colors outline-none placeholder:opacity-40 focus:border-current/40 focus:bg-white/10"
            value={groupQuery}
            onChange={(e) => setGroupQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <SearchIcon
            className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 opacity-25"
            fontSize="inherit"
          />
          {isFocused && filteredProductionGroups.length > 0 && (
            <ul className="border-archive-ink/10 bg-archive-paper absolute right-0 left-0 z-10 overflow-hidden rounded-xl border shadow-lg">
              {filteredProductionGroups.map((pg) => (
                <li
                  key={pg.id_url}
                  onMouseDown={() => selectGroup(pg)}
                  className="hover:bg-archive-accent cursor-pointer px-4 py-2 text-[11px] font-medium transition-colors hover:text-white"
                >
                  {pg.title}
                </li>
              ))}
            </ul>
          )}
        </div>
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
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [productionGroup, setProductionGroup] = useState<ProductionGroup | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const lp = useLocalizedPath();

  const isTitleEmpty = title.trim() === "";
  const isContentEmpty = contentHtml === "" || contentHtml === "<p></p>";
  const canSave = !isTitleEmpty && !isEditing && !isSaving;

  const selectedLanguage = lang === "nl" ? "nl" : "en";

  const saveTooltip = isEditing
    ? t("blogs.createBlogPage.save.saveDisabledReasonEditing")
    : isTitleEmpty
      ? t("blogs.createBlogPage.save.saveDisabledReasonTitle")
      : "";

  useUnsavedChangesBlocker(
    !isSaving &&
      (!isTitleEmpty ||
        !isContentEmpty ||
        mediaFiles.length > 0 ||
        productionGroup !== null)
  );

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    const newBlog: BlogCreate = {
      blog_content: {
        language: selectedLanguage,
        title: title,
        content: contentHtml,
      },
      series_id_url: productionGroup?.id_url,
    };
    try {
      const createdBlog: Blog = await createBlog(newBlog);
      // Regex match on the url BASE_URL/blogs/{id} and ignoring any possible url arguments after ?
      const blogNumericId = createdBlog.id_url.match(/\/blogs\/(\d+)(?:[/?#]|$)/)?.[1];
      if (blogNumericId && mediaFiles.length > 0) {
        const id = parseInt(blogNumericId, 10);
        await Promise.allSettled(
          mediaFiles.map((file) => uploadMediaForBlog(id, file))
        );
      }
      navigate(lp("/blogs"));
    } catch (err) {
      window.alert(`Save failed: ${err}`);
    } finally {
      setIsSaving(false);
    }
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
            <MediaUploadWidget onFilesChange={setMediaFiles} />
          </SectionCard>

          <SectionCard>
            <SeriesSearchBar
              productionGroup={productionGroup}
              setProductionGroup={setProductionGroup}
            />
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
          {t("blogs.createBlogPage.accessDenied.sectionLabel")}
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
