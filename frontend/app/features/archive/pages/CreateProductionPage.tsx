import { ProductionInfoSection } from "../components/ProductionInfoSection";
import { ProductionHeader } from "../components/ProductionHeader";
import { BackToCollectionLink } from "../components/BackToCollectionLink";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductionInfo } from "../types/productionTypes";
import { EditButton } from "../components/EditButton";
import { createProduction } from "../services/productionService";
import {
  getSanitizedHtmlOrUndefined,
  useUnsavedChangesBlocker,
  isEmptyHtml,
} from "../utils/productionPageFunctions";
import type { Tag } from "../types/tagTypes";
import type { EventWithResolvedRelations } from "../components/EventCard";
import { createEvent } from "../services/eventService";
import Tags from "../components/TagSection";
import EventSection from "../components/EventSection";
import { ProductionGeneralInfo } from "../components/ProductionGeneralInfo";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { uploadMedia } from "../services/mediaService";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import CloseIcon from "@mui/icons-material/Close";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

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

// ─── Media Upload Widget ───────────────────────────────────────────────────

type MediaPreview = { src: string; isVideo: boolean; file: File };

type MediaUploadWidgetProps = {
  onFilesChange: (files: File[]) => void;
  onBannerUrlChange: (url: string | undefined) => void;
};

/**
 * Files are held in browser memory only. `onFilesChange` is called with the
 * full ordered list every time it changes. The banner (first file) is tracked
 * with a star toggle — selecting a new banner moves that file to index 0 while
 * keeping the relative order of the rest.
 */
function MediaUploadWidget({
  onFilesChange,
  onBannerUrlChange,
}: MediaUploadWidgetProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function notify(updated: MediaPreview[]) {
    onFilesChange(updated.map((p) => p.file));
    onBannerUrlChange(updated[0]?.isVideo ? undefined : updated[0]?.src);
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .map((f) => ({
        src: URL.createObjectURL(f),
        isVideo: f.type.startsWith("video/"),
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
          {t("archive.media.acceptedFormats")}
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
              key={item.src}
              className={`relative aspect-square overflow-hidden rounded-xl bg-black ${
                i === 0 ? "ring-archive-accent ring-2" : ""
              }`}
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

// ─── Save handler ──────────────────────────────────────────────────────────

async function handleAddProduction(
  language: string,
  attendanceMode: string,
  performerType: string,
  draftInfo: ProductionInfo | null,
  draftTags: Tag[],
  draftEvents: EventWithResolvedRelations[],
  mediaFiles: File[],
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
      attendance_mode: attendanceMode,
      performer_type: performerType,
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
      tag_id_urls: draftTags.map((tag) => tag.id_url),
    });
    skipWarning.current = true;
    setSkipWarning(true);

    await Promise.all(
      draftEvents.map((event) =>
        createEvent({
          production_id_url: response["id_url"],
          hall_id_url: event.hall?.id_url,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          order_url: event.order_url,
        })
      )
    );

    // Upload media sequentially so the first file (banner) always lands first.
    if (mediaFiles.length > 0) {
      const productionNumericId = response["id_url"].match(
        /\/productions\/(\d+)(?:[/?#]|$)/
      )?.[1];
      if (productionNumericId) {
        const id = parseInt(productionNumericId, 10);
        for (const file of mediaFiles) {
          await uploadMedia(id, file);
        }
      }
    }

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

// ─── Access denied ─────────────────────────────────────────────────────────

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

// ─── Page ──────────────────────────────────────────────────────────────────

export function CreateProductionPage() {
  const { lang } = useParams();
  const language = lang ?? "nl";
  const { t } = useTranslation();
  const [draftAttendanceMode, setDraftAttendanceMode] = useState("");
  const [draftPerformerType, setDraftPerformerType] = useState("");
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
  const [draftTags, setDraftTags] = useState<Tag[]>([]);
  const [draftEvents, setDraftEvents] = useState<EventWithResolvedRelations[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | undefined>(
    undefined
  );

  const [isQuillDirty, setIsQuillDirty] = useState(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const skipWarning = useRef(false);
  const [skipWarningState, setSkipWarningState] = useState(false);

  useUnsavedChangesBlocker(
    !skipWarningState &&
      !isSaving &&
      (isInfoModified(draftInfo) || isQuillDirty || mediaFiles.length > 0)
  );
  const navigate = useNavigate();
  const isModified = useMemo(() => {
    return (
      draftTags.length > 0 ||
      draftEvents.length > 0 ||
      mediaFiles.length > 0 ||
      isInfoModified(draftInfo) ||
      isQuillDirty
    );
  }, [draftInfo, draftTags, isQuillDirty, draftEvents, mediaFiles]);

  const _handleAddProduction = () =>
    handleAddProduction(
      language,
      draftAttendanceMode,
      draftPerformerType,
      draftInfo,
      draftTags,
      draftEvents,
      mediaFiles,
      setIsSaving,
      t("archive.create_error"),
      skipWarning,
      setSkipWarningState,
      navigate
    );

  const teaserHtml = getSanitizedHtmlOrUndefined(draftInfo?.teaser);
  const descriptionHtml = getSanitizedHtmlOrUndefined(draftInfo?.description);
  const infoHtml = getSanitizedHtmlOrUndefined(draftInfo?.info);

  const isModifiedRef = useRef(false);
  const isQuillDirtyRef = useRef(false);

  useEffect(() => {
    isModifiedRef.current = isModified;
    isQuillDirtyRef.current = isQuillDirty;
  }, [draftInfo, isQuillDirty, isModified]);

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
      <main className="mx-auto flex w-full max-w-[900px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToCollectionLink />
        <h1 className="mb-2 font-serif text-3xl italic">
          {t("archive.create_production")}
        </h1>
        <ProductionHeader
          image_url={
            bannerPreviewUrl ??
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          }
          isEditing={true}
          originalInfo={null}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
          isCreateHeader={true}
        />
        <section id="production-info" className="mt-8">
          <article className="w-full min-w-0 space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <Tags
              originalTags={[]}
              draftTags={draftTags}
              setDraftTags={setDraftTags}
              isEditing={true}
            />
            <ProductionGeneralInfo
              isCreateGeneralInfo={true}
              isEditing={true}
              attendanceMode={draftAttendanceMode}
              originalAttendanceMode={undefined}
              performerType={draftPerformerType}
              originalPerformerType={undefined}
              onSave={(field, value) => {
                if (field === "attendance_mode") setDraftAttendanceMode(value);
                if (field === "performer_type") setDraftPerformerType(value);
              }}
            />
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
            <EventSection
              isEditing={true}
              production_id_url={undefined}
              originalEvents={[]}
              draftEvents={[]}
              setDraftEvents={() => {}}
              setDeletedEvents={() => {}}
              newEvents={draftEvents}
              setNewEvents={setDraftEvents}
            />
            <MediaUploadWidget
              onFilesChange={setMediaFiles}
              onBannerUrlChange={setBannerPreviewUrl}
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
            enable_save={isModified}
            setDraftAttendanceMode={() => {}}
            setDraftPerformerType={() => {}}
            originalAttendanceMode=""
            originalPerformerType=""
            is_saving={isSaving}
            _handleSave={_handleAddProduction}
            originalTags={null}
            setDraftTags={() => {}}
            permissions={[ARCHIVE_PERMISSIONS.create]}
          />
        </div>
      </main>
    </div>
  );
}
