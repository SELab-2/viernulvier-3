import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

import type { Blog, BlogContent } from "~/features/blogs/types/blogTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getProductionByUrl } from "~/features/archive/services/productionService";
import type { Production } from "~/features/archive/types/productionTypes";
import { BlogPageMediaGallery } from "~/features/blogs/components/BlogPageMediaGallery";
import { DeleteBlogButton } from "~/features/blogs/components/DeleteBlogButton";
import { getProductionInfoByLanguage } from "~/features/archive/components/ProductionCard";
import { Divider } from "@mui/material";

function getBlogContentByLanguage(
  blogContents: BlogContent[],
  language: string
): BlogContent | null {
  const languageMatch = blogContents.find((c) => c.language === language);
  return languageMatch ?? null;
}

function getSanitizedHtml(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  return DOMPurify.sanitize(trimmed);
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
  title: string;
};

function BlogHeader({ title }: BlogHeaderProps) {
  return (
    <section id="blog-header">
      <h1
        id="blog-title"
        className="text-archive-ink font-serif text-5xl leading-[1.08] md:text-7xl"
      >
        {title}
      </h1>
    </section>
  );
}

type BlogContentSectionProps = {
  contentHtml: string;
};

function BlogContentSection({ contentHtml }: BlogContentSectionProps) {
  return (
    <div
      id="blog-content"
      className="prose prose-archive max-w-none opacity-90"
      dangerouslySetInnerHTML={{ __html: contentHtml }}
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
    lang ?? "en"
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

  const title = blogContent?.title.trim() || t("blogs.contentPage.fallback");
  const contentHtml = getSanitizedHtml(blogContent?.content);

  useEffect(() => {
    let cancelled = false;

    async function loadProductions() {
      if (blog.production_id_urls.length === 0) return;

      const settled = await Promise.all(
        blog.production_id_urls.map(async (url) => {
          try {
            return await getProductionByUrl(url);
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setLinkedProductions(settled.filter((p): p is Production => p !== null));
      }
    }

    void loadProductions();

    return () => {
      cancelled = true;
    };
  }, [blog.production_id_urls]);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToBlogsLink />

        <BlogHeader title={title} />

        <Divider />

        <section id="blog-body" className="mt-8">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            {contentHtml ? (
              <BlogContentSection contentHtml={contentHtml} />
            ) : (
              <p className="opacity-75">{t("blogs.contentPage.fallback")}</p>
            )}
          </article>
        </section>

        <BlogPageMediaGallery contentHtml={contentHtml ?? ""} title={title} />

        <LinkedProductions productions={linkedProductions} />
      </main>

      <div className="fixed right-6 bottom-6 z-50 flex gap-3">
        {blogNumericId && <DeleteBlogButton blogId={Number(blogNumericId)} />}
      </div>
    </div>
  );
}
