import { ArchiveTextField } from "~/shared/components/ArchiveTextField";
import { ArchiveRichTextField } from "~/shared/components/ArchiveRichTextField";
import { useState } from "react";
import type { Delta } from "quill";
import { useTranslation } from "react-i18next";

export function CreateBlogPage() {
  const [content, setContent] = useState<Delta | null>(null);

  return (
    <div>
      <ArchiveTextField label="title" />
      <ArchiveRichTextField label="content" value={content} onChange={setContent} />
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
