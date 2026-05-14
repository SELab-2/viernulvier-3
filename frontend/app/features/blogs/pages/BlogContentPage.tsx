import { Link, useBlocker, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

import type { Blog, BlogContent } from "~/features/blogs/types/blogTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import type { Production } from "~/features/archive/types/productionTypes";
import { BlogPageMediaGallery } from "~/features/blogs/components/BlogPageMediaGallery";
import { DeleteBlogButton } from "~/features/blogs/components/DeleteBlogButton";
import { getProductionInfoByLanguage } from "~/features/archive/components/ProductionCard";
import { Divider } from "@mui/material";
import { getProductionsForBlog } from "../services/blogService";
import SimpleEditableField from "~/shared/components/SimpleEditableField";
import { BLOG_PERMISSIONS } from "../blog.constants";
import BlogEditButton from "../components/BlogEditButton";
import { updateBlogByUrl } from "../services/blogService";
import ComplexEditableField from "~/shared/components/ComplexEditableField";

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
  productions: Production[];
};

function LinkedProductions({ productions }: LinkedProductionsProps) {
  const { t } = useTranslation();

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

async function handleContentSave(
  blog: Blog,
  originalContent: BlogContent | null,
  draftContent: BlogContent | null,
  setOriginalContent: React.Dispatch<React.SetStateAction<BlogContent | null>>,
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
    });

    // sync local "source of truth"
    setOriginalContent(draftContent);

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
  const [linkedProductions, setLinkedProductions] = useState<Production[]>([]);

  const { t } = useTranslation();
  const { lang } = useParams();

  const language = preferredLanguage ?? lang!;
  const blogContent = getBlogContentByLanguage(blog.blog_contents, language);
  const blogNumericId = blog.id_url.match(/\/blogs\/(\d+)(?:[/?#]|$)/)?.[1];

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [originalContent, setOriginalContent] = useState<BlogContent | null>(
    blogContent
  );
  const [draftContent, setDraftContent] = useState<BlogContent | null>({
    ...blogContent!,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const _handleSave = () =>
    handleContentSave(
      blog,
      originalContent,
      draftContent,
      setOriginalContent,
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
    return isContentModified(originalContent, draftContent);
  }, [originalContent, draftContent, isEditing]);

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
    async function loadProductions() {
      if (!blog.production_group_id_url) return;
      try {
        const productions = await getProductionsForBlog(blog);
        if (!cancelled) {
          setLinkedProductions(productions.filter((p): p is Production => p !== null));
        }
      } catch {
        if (!cancelled) {
          setLinkedProductions([]);
        }
      }
    }
    void loadProductions();
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
          />

          <LinkedProductions productions={linkedProductions} />

          {originalContent !== null ? (
            <div className="fixed right-6 bottom-6 z-50 flex gap-3">
              {blogNumericId && <DeleteBlogButton blogId={Number(blogNumericId)} />}
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
              {blogNumericId && <DeleteBlogButton blogId={Number(blogNumericId)} />}
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
