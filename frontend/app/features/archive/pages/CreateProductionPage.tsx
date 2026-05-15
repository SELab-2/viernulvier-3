import { ProductionInfoSection } from "../components/ProductionInfoSection";
import { ProductionHeader } from "../components/ProductionHeader";
import { BackToCollectionLink } from "../components/BackToCollectionLink";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductionInfo } from "../types/productionTypes";
import { EditButton } from "../components/EditButton";
import { createProduction } from "../services/productionService";
import {
  getSanitizedHtmlOrUndefined,
  useUnsavedChangesBlocker,
  isEmptyHtml,
} from "../utils/productionPageFunctions";

function isInfoModified(draftInfo: ProductionInfo | null): boolean {
  if (!draftInfo) return false;

  return (
    !!draftInfo.title ||
    !!draftInfo.supertitle ||
    !!draftInfo.artist ||
    !!draftInfo.tagline ||
    !!draftInfo.teaser ||
    !!draftInfo.description ||
    !!draftInfo.info
  );
}

async function handleAddProduction(
  language: string,
  draftInfo: ProductionInfo | null,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  errorMessage: string,
  skipWarning: React.RefObject<boolean>,
  setSkipWarning: React.Dispatch<React.SetStateAction<boolean>>,
  navigate: (path: string) => void
) {
  if (!draftInfo) return;
  setIsSaving(true);

  try {
    const response = await createProduction({
      production_info: {
        language: language,
        artist: draftInfo.artist,
        title: draftInfo.title,
        supertitle: draftInfo.supertitle,
        tagline: draftInfo.tagline,
        teaser: draftInfo.teaser,
        description: draftInfo.description,
        info: draftInfo.info,
      },
      tag_id_urls: [],
    });
    skipWarning.current = true;
    setSkipWarning(true);

    // Go to newly created production
    const currentParts = window.location.pathname.split("/");
    const responseParts = response["id_url"].split("/");
    currentParts[currentParts.length - 1] = responseParts[responseParts.length - 1];
    navigate(currentParts.join("/"));
  } catch (e) {
    window.alert(`${errorMessage}: ${e}`);
  } finally {
    setIsSaving(false);
  }
}

export function CreateProductionPageAccessDenied() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="border-archive-border bg-archive-surface rounded-[2rem] border p-8 shadow-[0_20px_70px_rgba(45,40,37,0.05)]">
        <title>{`${t("archive.accessDenied.sectionLabel")} | VIERNULVIER`}</title>
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
  const language = lang ?? "nl";
  const { t } = useTranslation();
  const [draftInfo, setDraftInfo] = useState<ProductionInfo | null>({
    production_id_url: "",
    language: lang!,
    title: "",
    supertitle: "",
    artist: "",
    tagline: "",
    teaser: "",
    description: "",
    info: "",
  });
  const [isQuillDirty, setIsQuillDirty] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const skipWarning = useRef(false);
  const [skipWarningState, setSkipWarningState] = useState(false);

  useUnsavedChangesBlocker(
    !skipWarningState && !isSaving && (isInfoModified(draftInfo) || isQuillDirty)
  );
  const navigate = useNavigate();

  const _handleAddProduction = () =>
    handleAddProduction(
      language,
      draftInfo,
      setIsSaving,
      t("archive.create_error"),
      skipWarning,
      setSkipWarningState,
      navigate
    );
  // TODO
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const imageUrl = fallbackImageUrl;
  const teaserHtml = getSanitizedHtmlOrUndefined(draftInfo?.teaser);
  const descriptionHtml = getSanitizedHtmlOrUndefined(draftInfo?.description);
  const infoHtml = getSanitizedHtmlOrUndefined(draftInfo?.info);

  // warning if going to another url when edits are not saved.
  const isModifiedRef = useRef(false);
  const isQuillDirtyRef = useRef(false);

  useEffect(() => {
    isModifiedRef.current = isInfoModified(draftInfo);
    isQuillDirtyRef.current = isQuillDirty;
  }, [draftInfo, isQuillDirty]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipWarning.current) return;
      if (isModifiedRef.current || isQuillDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <title>{`${t("nav.create_production")} | VIERNULVIER`}</title>
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToCollectionLink />
        <h1 className="mb-2 font-serif text-3xl italic">
          {t("archive.create_production")}
        </h1>
        <ProductionHeader
          production_info={null}
          image_url={imageUrl}
          isEditing={true}
          originalInfo={null}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
          isCreateHeader={true}
        />
        <section id="production-info" className="mt-8">
          <article className="w-full min-w-0 space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <ProductionInfoSection
              isCreateInfo={true}
              tagline={draftInfo?.tagline ?? ""}
              originalTagline={undefined}
              teaserHtml={teaserHtml}
              descriptionHtml={descriptionHtml}
              infoHtml={infoHtml}
              isEditing={true}
              onSave={(field, html) => {
                setDraftInfo((prev) =>
                  prev ? { ...prev, [field]: isEmptyHtml(html) ? null : html } : prev
                );
              }}
              onQuillDirtyChange={useCallback(
                (isDirty: boolean) => setIsQuillDirty(isDirty),
                []
              )}
            />
          </article>
        </section>
        <div className="fixed right-6 bottom-6 z-50 flex gap-3">
          <EditButton
            action={t("archive.create_production")}
            isEditing={true}
            setIsEditing={() => {}}
            originalInfo={null}
            setDraftInfo={setDraftInfo}
            originalEvents={[]}
            setDraftEvents={() => {}}
            setNewEvents={() => {}}
            setDeletedEvents={() => {}}
            enable_save={isInfoModified(draftInfo) || isQuillDirty}
            is_saving={isSaving}
            _handleSave={_handleAddProduction}
            originalTags={null}
            setDraftTags={() => {}}
          />
        </div>
      </main>
    </div>
  );
}
