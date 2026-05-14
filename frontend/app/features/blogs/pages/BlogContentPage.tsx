import { Link, useBlocker, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

import type { Blog, BlogContent } from "~/features/blogs/types/blogTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import type { Production } from "~/features/archive/types/productionTypes";
import { BlogPageMediaGallery } from "~/features/blogs/components/BlogPageMediaGallery";
import { getProductionInfoByLanguage } from "~/features/archive/components/ProductionCard";
import { Divider } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SimpleEditableField from "~/shared/components/SimpleEditableField";
import { BLOG_PERMISSIONS } from "../blog.constants";
import BlogEditButton from "../components/BlogEditButton";
import { updateBlogByUrl } from "../services/blogService";
import ComplexEditableField from "~/shared/components/ComplexEditableField";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import {
  getAllProductionGroups,
  getProductionGroupByUrl,
  getProductionsForGroup,
} from "~/features/archive/services/productionGroupService";

function useUnsavedChangesBlocker(when: boolean) {
  const blocker = useBlocker(when);

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm("You have unsaved changes. Leave anyway?");

      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}

function getBlogContentByLanguage(
  blogContents: BlogContent[],
  language: string
): BlogContent | null {
  const languageMatch = blogContents.find((c) => c.language === language);
  return languageMatch ?? null;
}

function getSanitizedHtmlOrUndefined(
  value: string | null | undefined
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return DOMPurify.sanitize(trimmed);
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function isFieldModified(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
}

function BackToBlogsLink() {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  return (
    <Link
      id="back-to-blogs"
      to={lp("/blogs")}
      className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
    >
      {t("blogs.contentPage.backToBlogs")}
    </Link>
  );
}

type BlogHeaderProps = {
  isEditing: boolean;
  originalContent: BlogContent | null;
  draftContent: BlogContent | null;
  setDraftContent: React.Dispatch<React.SetStateAction<BlogContent | null>>;
};

function BlogHeader({
  isEditing,
  originalContent,
  draftContent,
  setDraftContent,
}: BlogHeaderProps) {
  const { t } = useTranslation();
  return (
    <section id="blog-header">
      <SimpleEditableField
        label={t("blogs.contentPage.edit.title")}
        value={draftContent?.title ?? ""}
        isEditing={isEditing}
        isModified={isFieldModified(originalContent?.title, draftContent?.title)}
        onChange={(newValue) => {
          setDraftContent((prev) => {
            // Overwrite title
            if (prev) return { ...prev, title: newValue };
            else return prev;
          });
        }}
        renderView={(value) => (
          <h1
            id="blog-title"
            className="text-archive-ink font-serif text-5xl leading-[1.08] md:text-7xl"
          >
            {getTextOrDefault(value, t("blogs.contentPage.fallback"))}
          </h1>
        )}
        permissions={[BLOG_PERMISSIONS.update]}
      />
    </section>
  );
}

type BlogContentSectionProps = {
  contentHtml: string | undefined;
  globalIsEditing: boolean;
  handleSave: (html: string) => void;
};

function BlogContentSection({
  contentHtml,
  globalIsEditing,
  handleSave,
}: BlogContentSectionProps) {
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const { t } = useTranslation();
  function _handleSave(html: string) {
    handleSave(html);
    setIsEditing(false);
  }
  return (
    <ComplexEditableField
      id="blog-content"
      field={t("blogs.contentPage.edit.content")}
      html={contentHtml}
      isEditing={globalIsEditing && isEditing}
      onStartEdit={() => setIsEditing(true)}
      onSave={(html) => _handleSave(html)}
      onCancel={() => setIsEditing(false)}
      fallback={<p className="opacity-75">{t("blogs.contentPage.fallback")}</p>}
      canEdit={globalIsEditing}
      permissions={[BLOG_PERMISSIONS.update]}
    />
  );
}

type ProductionLinkCardProps = {
  production: Production;
};

function ProductionLinkCard({ production }: ProductionLinkCardProps) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const lp = useLocalizedPath();

  const primaryInfo = getProductionInfoByLanguage(
    production.production_infos,
    lang ?? "nl"
  );

  const title = primaryInfo?.title ?? t("blogs.contentPage.fallback");
  const artist = primaryInfo?.artist ?? "";

  const id = production.id_url.match(/\/productions\/(\d+)(?:[/?#]|$)/)?.[1];
  if (!id) return null;

  return (
    <Link
      to={lp(`/archive/productions/${id}`)}
      className="p3 bg-archive-ink/5 bg-archive-ink-dark/5 border-archive-ink/5 border-archive-ink-dark/5 h-[60px] cursor-pointer rounded-lg border shadow-sm"
    >
      <div className="h-full rounded-lg p-3 transition">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        <p className="truncate text-xs">{artist}</p>
      </div>
    </Link>
  );
}

type LinkedProductionsProps = {
  productionGroup: ProductionGroup | null;
  isEditing: boolean;
  setNewProductionGroup: React.Dispatch<React.SetStateAction<ProductionGroup | null>>;
};

function LinkedProductions({
  productionGroup,
  isEditing,
  setNewProductionGroup,
}: LinkedProductionsProps) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [allProductionGroups, setAllProductionGroups] = useState<ProductionGroup[]>([]);
  const [selectedProductionGroup, setSelectedProductionGroup] =
    useState<ProductionGroup | null>(null);
  const [groupQuery, setGroupQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isEditing) return;
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
  }, [isEditing, productionGroup]);

  useEffect(() => {
    if (isEditing) return;
    let cancelled = false;
    async function loadProductions() {
      if (!productionGroup) {
        setProductions([]);
        return;
      }
      try {
        const intProductions = await getProductionsForGroup(productionGroup);
        if (!cancelled) setProductions(intProductions);
      } catch {
        if (!cancelled) setProductions([]);
      }
    }
    void loadProductions();
    return () => {
      cancelled = true;
    };
  }, [productionGroup, isEditing]);

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

    if (normalizedQuery.length === 0) {
      return false;
    }

    return normalizeProductionGroupText(productionGroup.title).includes(
      normalizedQuery
    );
  }

  const filteredProductionGroups =
    groupQuery.trim().length > 0
      ? allProductionGroups.filter((pg) => matchesProductionGroupQuery(pg, groupQuery))
      : [];

  const selectGroup = (pg: ProductionGroup) => {
    setSelectedProductionGroup(pg);
    setNewProductionGroup(pg);
    setGroupQuery("");
  };

  if (isEditing) {
    return (
      <section
        id="blog-linked-productions"
        aria-label="Linked productions"
        className="mt-12"
      >
        <h2 className="mb-6 text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
          {t("blogs.contentPage.linkedProductions")}
        </h2>
        <div className="space-y-3" style={{ maxWidth: "min(25%, 280px)" }}>
          {selectedProductionGroup && (
            <button
              onClick={() => {
                setSelectedProductionGroup(null);
                setNewProductionGroup(null);
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
              placeholder={t("blogs.contentPage.searchProductionGroups")}
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
      </section>
    );
  }

  if (productions.length === 0) return null;
  return (
    <section
      id="blog-linked-productions"
      aria-label="Linked productions"
      className="mt-12"
    >
      <h2 className="mb-6 text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
        {t("blogs.contentPage.linkedProductions")}
      </h2>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 310px), 1fr))",
        }}
      >
        {productions.map((production) => (
          <ProductionLinkCard key={production.id_url} production={production} />
        ))}
      </div>
    </section>
  );
}

function isContentModified(
  originalContent: BlogContent | null,
  draftContent: BlogContent | null
): boolean {
  if (!originalContent || !draftContent) return false;

  return (
    originalContent.title !== draftContent.title ||
    originalContent.content !== draftContent.content
  );
}

async function handleBlogSave(
  blog: Blog,
  originalContent: BlogContent | null,
  draftContent: BlogContent | null,
  setOriginalContent: React.Dispatch<React.SetStateAction<BlogContent | null>>,
  newBlogProdGroup: ProductionGroup | null,
  setBlogProdGroup: React.Dispatch<React.SetStateAction<ProductionGroup | null>>,
  setMediaEdited: React.Dispatch<React.SetStateAction<boolean>>,
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  language: string,
  skipUnloadWarning: React.MutableRefObject<boolean>
) {
  if (!draftContent) return;

  setIsSaving(true);
  try {
    await updateBlogByUrl(blog.id_url, {
      blog_contents: [
        {
          language: language,
          title: draftContent.title,
          content: draftContent.content,
        },
      ],
      production_group_id_url: newBlogProdGroup ? newBlogProdGroup.id_url : "",
    });

    // sync local "source of truth"
    setOriginalContent(draftContent);

    setBlogProdGroup(newBlogProdGroup);

    setMediaEdited(false);

    setIsEditing(false);
    if (!originalContent) {
      skipUnloadWarning.current = true;
      window.location.reload();
    }
  } catch (err) {
    window.alert(`Save failed: ${err}`);
  } finally {
    setIsSaving(false);
  }
}

interface BlogPageProps {
  blog: Blog;
  preferredLanguage?: string;
}

export function BlogContentPage({ blog, preferredLanguage }: BlogPageProps) {
  const [blogProdGroup, setBlogProdGroup] = useState<ProductionGroup | null>(null);
  const [newBlogProdGroup, setNewBlogProdGroup] = useState<ProductionGroup | null>(
    null
  );
  const { t } = useTranslation();
  const { lang } = useParams();

  const language = preferredLanguage ?? lang!;
  const blogContent = getBlogContentByLanguage(blog.blog_contents, language);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [originalContent, setOriginalContent] = useState<BlogContent | null>(
    blogContent
  );
  const [draftContent, setDraftContent] = useState<BlogContent | null>({
    ...blogContent!,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mediaEdited, setMediaEdited] = useState<boolean>(false);

  const blogProdModified = useCallback(() => {
    if (mediaEdited) return true;
    return (
      (blogProdGroup &&
        newBlogProdGroup &&
        blogProdGroup.id_url !== newBlogProdGroup.id_url) ||
      (!blogProdGroup && newBlogProdGroup) ||
      (blogProdGroup && !newBlogProdGroup)
    );
  }, [blogProdGroup, newBlogProdGroup, mediaEdited]);

  const _handleSave = () =>
    handleBlogSave(
      blog,
      originalContent,
      draftContent,
      setOriginalContent,
      newBlogProdGroup,
      setBlogProdGroup,
      setMediaEdited,
      setIsEditing,
      setIsSaving,
      language,
      skipUnloadWarning
    );

  const title = blogContent?.title.trim() || t("blogs.contentPage.fallback");
  const contentHtml = getSanitizedHtmlOrUndefined(draftContent?.content);

  const isModified = useMemo(() => {
    if (originalContent === null) {
      return isEditing; // With add always true.
    }
    if (blogProdModified()) {
      return true;
    }
    return isContentModified(originalContent, draftContent);
  }, [originalContent, draftContent, isEditing, blogProdModified]);

  const skipUnloadWarning = useRef(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipUnloadWarning.current) return; // skip bij reload na save
      if (isEditing && isModified) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing, isModified]);

  useUnsavedChangesBlocker(isEditing && isModified && !skipUnloadWarning);

  useEffect(() => {
    let cancelled = false;
    async function loadProductionGroup() {
      if (!blog.production_group_id_url) return;
      try {
        const productionGroup = await getProductionGroupByUrl(
          blog.production_group_id_url
        );
        if (!cancelled) {
          setBlogProdGroup(productionGroup);
          setNewBlogProdGroup(productionGroup);
        }
      } catch {
        if (!cancelled) {
          setBlogProdGroup(null);
          setNewBlogProdGroup(null);
        }
      }
    }
    void loadProductionGroup();
    return () => {
      cancelled = true;
    };
  }, [blog]);

  return (
    <>
      <title>{`${t("nav.blog")}: ${originalContent?.title ?? ""} | VIERNULVIER`}</title>
      <div className="bg-archive-paper text-archive-ink min-h-screen">
        <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
          <BackToBlogsLink />

          <BlogHeader
            isEditing={isEditing}
            originalContent={originalContent}
            draftContent={draftContent}
            setDraftContent={setDraftContent}
          />

          <Divider />

          <section id="blog-body" className="mt-8">
            <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
              <BlogContentSection
                contentHtml={contentHtml}
                globalIsEditing={isEditing}
                handleSave={(html) => {
                  setDraftContent((prev) => (prev ? { ...prev, content: html } : prev));
                }}
              />
            </article>
          </section>

          <BlogPageMediaGallery
            contentHtml={contentHtml ?? ""}
            title={title}
            blog_id_url={blog.id_url}
            isEditing={isEditing}
            setMediaEdited={setMediaEdited}
          />

          <LinkedProductions
            productionGroup={blogProdGroup}
            isEditing={isEditing}
            setNewProductionGroup={setNewBlogProdGroup}
          />
          {originalContent !== null ? (
            <div className="fixed right-6 bottom-6 z-50 flex gap-3">
              <BlogEditButton
                action={t("blogs.contentPage.edit.edit")}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                originalContent={originalContent}
                setDraftContent={setDraftContent}
                enable_save={
                  isModified &&
                  draftContent !== null &&
                  draftContent.title !== "" &&
                  draftContent.content !== "" &&
                  draftContent.content !== "<p></p>"
                }
                is_saving={isSaving}
                _handleSave={_handleSave}
              />
            </div>
          ) : (
            <div className="fixed right-6 bottom-6 z-50 flex gap-3">
              <BlogEditButton
                action={t("blogs.contentPage.edit.add")}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                originalContent={null}
                setDraftContent={setDraftContent}
                enable_save={
                  draftContent !== null &&
                  "title" in draftContent &&
                  draftContent.title !== "" &&
                  "content" in draftContent &&
                  draftContent.content !== "" &&
                  draftContent.content !== "<p></p>"
                }
                is_saving={isSaving}
                _handleSave={_handleSave}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
