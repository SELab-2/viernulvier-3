import { ProductionInfoSection } from "../components/ProductionInfoSection";
import { ProductionHeader } from "../components/ProductionHeader";
import { BackToCollectionLink } from "../components/BackToCollectionLink";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import type { ProductionInfo } from "../types/productionTypes";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

export function CreateProductionPageAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <p className="text-xs font-bold tracking-[0.24em] uppercase opacity-40">
          {t("archive.accessDenied.sectionLabel")}
        </p>
        <h1 className="mt-3 font-serif text-4xl italic md:text-5xl">
          {t("archive.accessDenied.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-70">
          {t("archive.accessDenied.description")}
        </p>
      </div>
    </section>
  );
}

export function CreateProductionPage() {
  const { lang } = useParams();
  const { t } = useTranslation();
  const emptyInfo: ProductionInfo = {
    production_id_url: "",
    language: lang!,
    title: t("archive.add_info.title"),
    supertitle: t("archive.add_info.supertitle"),
    artist: t("archive.add_info.artist"),
    tagline: t("archive.add_info.tagline"),
    teaser: t("archive.add_info.teaser"),
    description: t("archive.add_info.description"),
    info: t("archive.add_info.info"),
  };
  const [draftInfo, setDraftInfo] = useState<ProductionInfo | null>(emptyInfo);
  const [isQuillDirty, setIsQuillDirty] = useState(false);

  // TODO
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";
  const imageUrl = fallbackImageUrl;

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <title>{`${t("archive.create_production")} | VIERNULVIER`}</title>
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToCollectionLink />
        <ProductionHeader
          production_info={null}
          image_url={imageUrl}
          isEditing={true}
          originalInfo={emptyInfo}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
        />
        <section id="production-info" className="mt-8">
          <article className="w-full min-w-0 space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <ProductionInfoSection
              tagline={emptyInfo.tagline!}
              originalTagline={emptyInfo.tagline}
              teaserHtml={emptyInfo.teaser}
              descriptionHtml={emptyInfo.description}
              infoHtml={emptyInfo.info}
              isEditing={true}
              onSave={(field, html) => {
                const isEmpty = html === "<p><br></p>" || html === "";
                setDraftInfo((prev) =>
                  prev ? { ...prev, [field]: isEmpty ? null : html } : prev
                );
              }}
              onQuillDirtyChange={useCallback(
                (isDirty: boolean) => setIsQuillDirty(isDirty),
                []
              )}
              permissions={[ARCHIVE_PERMISSIONS.create, ARCHIVE_PERMISSIONS.update]}
            />
          </article>
        </section>
      </main>
    </div>
  );
}
