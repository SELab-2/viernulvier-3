import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSanitizedHtmlOrUndefined,
  getTextOrDefault,
  useUnsavedChangesBlocker,
  isEmptyHtml,
} from "../utils/productionPageFunctions";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { Blog } from "~/features/blogs/types/blogTypes";
import {
  createEvent,
  getEventByUrl,
  getPriceByUrl,
  updateEventByUrl,
} from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { type EventWithResolvedRelations } from "../components/EventCard";
import { ProductionPageMediaGallery } from "../components/ProductionPageMediaGallery";
import { updateProductionByUrl } from "../services/productionService";
import { deleteByUrl } from "~/shared/services/sharedService";
import { getMediaForProduction } from "~/features/archive/services/mediaService";
import { getBlogsForProduction } from "~/features/blogs/services/blogService";
import { BlogCardList } from "~/features/blogs/components/BlogCard";
import { ProductionInfoSection } from "../components/ProductionInfoSection";
import type { Tag } from "../types/tagTypes";
import { BackToCollectionLink } from "../components/BackToCollectionLink";
import { DeleteInfoButton } from "../components/DeleteInfoButton";
import { EditButton } from "../components/EditButton";
import { ProductionHeader } from "../components/ProductionHeader";
import EventSection from "../components/EventSection";
import Tags from "../components/TagSection";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { ProductionGeneralInfo } from "../components/ProductionGeneralInfo";

interface ProductionPageProps {
  production: Production;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfo[],
  language: string
): ProductionInfo | null {
  const languageMatch = productionInfos.find((info) => info.language === language);
  if (languageMatch) {
    return languageMatch;
  }
  return null;
}

function getEventTimestamp(startsAt?: string): number {
  if (!startsAt) {
    return Number.POSITIVE_INFINITY;
  }

  const parsedDate = new Date(startsAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return parsedDate.getTime();
}

function isInfoModified(
  originalInfo: ProductionInfo | null,
  draftInfo: ProductionInfo | null
): boolean {
  if (!originalInfo || !draftInfo) return false;

  return (
    originalInfo.title !== draftInfo.title ||
    originalInfo.supertitle !== draftInfo.supertitle ||
    originalInfo.artist !== draftInfo.artist ||
    originalInfo.tagline !== draftInfo.tagline ||
    originalInfo.teaser !== draftInfo.teaser ||
    originalInfo.description !== draftInfo.description ||
    originalInfo.info !== draftInfo.info
  );
}
function areTagsModified(originalTags: Tag[], draftTags: Tag[]): boolean {
  if (originalTags.length !== draftTags.length) {
    return true;
  }

  const originalIds = originalTags.map((tag) => tag.id_url).sort();

  const draftIds = draftTags.map((tag) => tag.id_url).sort();

  return originalIds.some((id, index) => id !== draftIds[index]);
}

function isEventModified(original?: Event, draft?: Event): boolean {
  if (!original || !draft) return false;

  return (
    original.starts_at !== draft.starts_at ||
    original.ends_at !== draft.ends_at ||
    original.order_url !== draft.order_url ||
    original.hall?.id_url !== draft.hall?.id_url
  );
}

async function handleInfoSave(
  production: Production,
  attendance_mode: string,
  setOriginalAttendanceMode: React.Dispatch<React.SetStateAction<string>>,
  performer_type: string,
  setOriginalPerformerType: React.Dispatch<React.SetStateAction<string>>,
  originalInfo: ProductionInfo | null,
  draftInfo: ProductionInfo | null,
  setOriginalInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>,
  draftTags: Tag[],
  setOriginalTags: React.Dispatch<React.SetStateAction<Tag[]>>,
  draftEvents: EventWithResolvedRelations[],
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  originalEvents: EventWithResolvedRelations[],
  setOriginalEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  newEvents: EventWithResolvedRelations[],
  setNewEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  deletedEvents: EventWithResolvedRelations[],
  setDeletedEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  setMediaEdited: React.Dispatch<React.SetStateAction<boolean>>,
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  language: string,
  skipUnloadWarning: React.RefObject<boolean>,
  setSkipWarning: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (!draftInfo) return;
  setIsSaving(true);

  const production_id_url = production.id_url;
  try {
    await updateProductionByUrl(production_id_url, {
      attendance_mode: attendance_mode,
      performer_type: performer_type,
      production_infos: [
        {
          language: language,
          title: draftInfo.title,
          supertitle: draftInfo.supertitle,
          artist: draftInfo.artist,
          tagline: draftInfo.tagline,
          teaser: draftInfo.teaser,
          description: draftInfo.description,
          info: draftInfo.info,
        },
      ],
      tag_id_urls: draftTags.map((tag) => tag.id_url),
    });

    // Find and patch edited events
    const originalMap = new Map(originalEvents.map((e) => [e.id_url, e]));
    const updatedEvents = draftEvents.filter((draft) => {
      if (!draft.id_url) return false;
      const original = originalMap.get(draft.id_url);
      if (!original) return false;
      return isEventModified(original, draft);
    });
    for (const event of updatedEvents) {
      await updateEventByUrl(event.id_url, {
        hall_id_url: event.hall?.id_url,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
      });
    }

    // Create newly made events
    const createdEvents: EventWithResolvedRelations[] = [];
    for (const event of newEvents) {
      const created = await createEvent({
        production_id_url,
        hall_id_url: event.hall?.id_url,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        order_url: event.order_url,
      });

      createdEvents.push({
        ...created,
        resolvedHall: event.resolvedHall,
        resolvedPrices: [],
      });
    }

    for (const event of deletedEvents) {
      // skip events that were never created
      if (!event.id_url) continue;

      await deleteByUrl(event.id_url);
    }

    // sync local "source of truth"
    setOriginalAttendanceMode(attendance_mode);
    setOriginalPerformerType(performer_type);
    setOriginalTags(draftTags);
    setOriginalInfo(draftInfo);
    setOriginalEvents([...draftEvents, ...createdEvents]);
    setDraftEvents([...draftEvents, ...createdEvents]);
    setNewEvents([]);
    setDeletedEvents([]);
    setMediaEdited(false);

    setIsEditing(false);
    if (!originalInfo) {
      skipUnloadWarning.current = true;
      setSkipWarning(true);
      window.location.reload();
    }
  } catch (err) {
    window.alert(`Save failed: ${err}`);
  } finally {
    setIsSaving(false);
  }
}

export function ProductionPage({ production, preferredLanguage }: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();

  const language = preferredLanguage ?? lang!;
  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  const [firstImageUrl, setFirstImageUrl] = useState<string | undefined>(undefined);
  const [originalEvents, setOriginalEvents] = useState<EventWithResolvedRelations[]>(
    []
  );
  const [draftEvents, setDraftEvents] = useState<EventWithResolvedRelations[]>([]);
  const [newEvents, setNewEvents] = useState<EventWithResolvedRelations[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<EventWithResolvedRelations[]>([]);
  const [linkedBlogs, setLinkedBlogs] = useState<Blog[]>([]);

  // States for editing the production info shown
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [originalInfo, setOriginalInfo] = useState<ProductionInfo | null>(
    productionInfo
  );
  const [draftInfo, setDraftInfo] = useState<ProductionInfo | null>({
    ...productionInfo!,
  });
  const [originalTags, setOriginalTags] = useState<Tag[]>(production.tags ?? []);
  const [draftTags, setDraftTags] = useState<Tag[]>(production.tags ?? []);

  // General Info
  const [draftPerformerType, setDraftPerformerType] = useState<string>(
    production.performer_type ?? ""
  );
  const [draftAttendanceMode, setDraftAttendanceMode] = useState<string>(
    production.attendance_mode ?? ""
  );
  const [originalPerformerType, setOriginalPerformerType] = useState<string>(
    production.performer_type ?? ""
  );
  const [originalAttendanceMode, setOriginalAttendanceMode] = useState<string>(
    production.attendance_mode ?? ""
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mediaEdited, setMediaEdited] = useState<boolean>(false);

  const _handleSave = () =>
    handleInfoSave(
      production,
      draftAttendanceMode,
      setOriginalAttendanceMode,
      draftPerformerType,
      setOriginalPerformerType,
      originalInfo,
      draftInfo,
      setOriginalInfo,
      draftTags,
      setOriginalTags,
      draftEvents,
      setDraftEvents,
      originalEvents,
      setOriginalEvents,
      newEvents,
      setNewEvents,
      deletedEvents,
      setDeletedEvents,
      setMediaEdited,
      setIsEditing,
      setIsSaving,
      language,
      skipUnloadWarning,
      setSkipWarning
    );
  const areEventsModified = useMemo(() => {
    return (
      newEvents.length > 0 ||
      deletedEvents.length > 0 ||
      draftEvents.some((draft, i) => isEventModified(originalEvents[i], draft))
    );
  }, [draftEvents, originalEvents, newEvents, deletedEvents]);

  // State when editing, keeps track if something has changed
  // (to enable save button)
  const isModified = useMemo(() => {
    if (originalInfo === null) {
      return isEditing; // With add always true.
    }
    const generalModified =
      originalAttendanceMode !== draftAttendanceMode ||
      originalPerformerType !== draftPerformerType;
    const tagsModified = areTagsModified(originalTags, draftTags);
    return (
      tagsModified ||
      generalModified ||
      isInfoModified(originalInfo, draftInfo) ||
      areEventsModified ||
      mediaEdited
    );
  }, [
    originalInfo,
    draftInfo,
    isEditing,
    originalTags,
    draftTags,
    areEventsModified,
    originalAttendanceMode,
    draftAttendanceMode,
    originalPerformerType,
    draftPerformerType,
    mediaEdited,
  ]);

  useEffect(() => {
    const match = production.id_url.match(/\/productions\/(\d+)(?:[/?#]|$)/);
    const productionNumericId = match ? Number(match[1]) : undefined;
    if (!productionNumericId) return;

    getMediaForProduction(productionNumericId, { limit: 1 })
      .then((response) => {
        const first = response.media.find((m) => m.content_type.startsWith("image/"));
        if (first) setFirstImageUrl(first.url);
      })
      .catch(() => {});
  }, [production.id_url]);

  const skipUnloadWarning = useRef(false);
  const isEditingRef = useRef(false);
  const isModifiedRef = useRef(false);
  const isQuillDirtyRef = useRef(false);
  const [skipWarning, setSkipWarning] = useState(false);
  const [isQuillDirty, setIsQuillDirty] = useState(false);

  useEffect(() => {
    isEditingRef.current = isEditing;
    isModifiedRef.current = isModified;
    isQuillDirtyRef.current = isQuillDirty;
  }, [isEditing, isModified, isQuillDirty]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipUnloadWarning.current) return;
      if (isEditingRef.current && (isModifiedRef.current || isQuillDirtyRef.current)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useUnsavedChangesBlocker(isEditing && (isModified || isQuillDirty) && !skipWarning);

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const teaserHtml = getSanitizedHtmlOrUndefined(draftInfo?.teaser);
  const descriptionHtml = getSanitizedHtmlOrUndefined(draftInfo?.description);
  const infoHtml = getSanitizedHtmlOrUndefined(draftInfo?.info);

  //TODO maybe an image saying no image found? Or something else? idk
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const imageUrl = firstImageUrl ?? fallbackImageUrl;
  // keep events chronologically ordered for a predictable schedule list
  const eventObjects = useMemo(
    () =>
      originalEvents.slice().sort((leftEvent, rightEvent) => {
        const startDifference =
          getEventTimestamp(leftEvent.starts_at) -
          getEventTimestamp(rightEvent.starts_at);

        if (startDifference !== 0) {
          return startDifference;
        }

        return leftEvent.id_url.localeCompare(rightEvent.id_url);
      }),
    [originalEvents]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadEventDetails = async () => {
      if (!isCancelled) {
        setOriginalEvents([]);
      }

      try {
        if (production.event_id_urls.length === 0) {
          return;
        }

        const hydratedEvents = await Promise.all(
          production.event_id_urls.map(
            async (eventUrl): Promise<EventWithResolvedRelations | null> => {
              let event: Event | undefined;

              try {
                event = await getEventByUrl(eventUrl);
              } catch {
                return null;
              }

              if (!event) {
                return null;
              }

              const hallPromise = event.hall?.id_url
                ? getHallByUrl(event.hall.id_url).catch(() => undefined)
                : Promise.resolve(undefined);

              const pricesPromise =
                event.price_urls.length > 0
                  ? Promise.all(
                      event.price_urls.map(async (priceUrl) => {
                        try {
                          return await getPriceByUrl(priceUrl);
                        } catch {
                          return undefined;
                        }
                      })
                    ).then((prices) =>
                      prices.filter((price): price is Price => Boolean(price))
                    )
                  : Promise.resolve([] as Price[]);

              const [resolvedHall, resolvedPrices] = await Promise.all([
                hallPromise,
                pricesPromise,
              ]);

              return {
                ...event,
                resolvedHall,
                resolvedPrices,
              };
            }
          )
        );

        if (!isCancelled) {
          const validEvents = hydratedEvents.filter(
            (event): event is EventWithResolvedRelations => event !== null
          );

          setOriginalEvents(validEvents);
          setDraftEvents(validEvents.map((e) => ({ ...e }))); // copy
        }
      } catch {
        if (!isCancelled) {
          setOriginalEvents([]);
        }
      }
    };

    void loadEventDetails();

    return () => {
      isCancelled = true;
    };
  }, [production.event_id_urls, i18n.resolvedLanguage]);

  // Load linked blogs for this production
  useEffect(() => {
    let isCancelled = false;

    const loadLinkedBlogs = async () => {
      try {
        const blogs = await getBlogsForProduction(production.id_url);
        if (!isCancelled) {
          setLinkedBlogs(blogs ?? []);
        }
      } catch {
        if (!isCancelled) {
          setLinkedBlogs([]);
        }
      }
    };

    void loadLinkedBlogs();

    return () => {
      isCancelled = true;
    };
  }, [production.id_url]);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
      <title>{`${title} | VIERNULVIER`}</title>
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 pt-10 pb-16 md:px-12">
        <BackToCollectionLink />
        <ProductionHeader
          image_url={imageUrl}
          isEditing={isEditing}
          originalInfo={originalInfo}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
          isCreateHeader={false}
        />

        <Tags
          performer_type={originalPerformerType}
          originalTags={originalTags}
          draftTags={draftTags}
          setDraftTags={setDraftTags}
          isEditing={isEditing}
        />

        <section id="production-events" className="mt-8">
          <article className="w-full min-w-0 space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <ProductionGeneralInfo
              isCreateGeneralInfo={false}
              isEditing={isEditing}
              attendanceMode={draftAttendanceMode}
              originalAttendanceMode={originalAttendanceMode}
              performerType={draftPerformerType}
              originalPerformerType={originalPerformerType}
              onSave={(field, value) => {
                if (field === "attendance_mode") setDraftAttendanceMode(value);
                if (field === "performer_type") setDraftPerformerType(value);
              }}
            />
            <ProductionInfoSection
              isCreateInfo={false}
              tagline={draftInfo?.tagline ?? ""}
              originalTagline={originalInfo?.tagline ?? undefined}
              teaserHtml={teaserHtml}
              descriptionHtml={descriptionHtml}
              infoHtml={infoHtml}
              isEditing={isEditing}
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
              isEditing={isEditing}
              production_id_url={production.id_url}
              originalEvents={eventObjects}
              draftEvents={draftEvents}
              setDraftEvents={setDraftEvents}
              setDeletedEvents={setDeletedEvents}
              newEvents={newEvents}
              setNewEvents={setNewEvents}
            />

            {linkedBlogs.length > 0 && (
              <section className="bg-archive-surface-strong mt-8 rounded-[1.75rem] p-6">
                <h2 className="mb-6 text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                  {t("productionPage.linkedBlogs")}
                </h2>

                <BlogCardList
                  blogs={linkedBlogs}
                  prefferedLanguage={language}
                  compactCards
                />
              </section>
            )}
          </article>
        </section>

        <ProductionPageMediaGallery
          production_id_url={production.id_url}
          title={title}
          isEditing={isEditing}
          setMediaEdited={setMediaEdited}
        />
      </main>

      {productionInfo !== null ? (
        <div className="fixed right-6 bottom-6 z-50 flex gap-3">
          <EditButton
            action={t("productionPage.edit.edit")}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            originalInfo={originalInfo}
            setDraftInfo={setDraftInfo}
            originalTags={originalTags}
            setDraftTags={setDraftTags}
            originalEvents={originalEvents}
            setDraftEvents={setDraftEvents}
            setNewEvents={setNewEvents}
            setDeletedEvents={setDeletedEvents}
            setDraftAttendanceMode={setDraftAttendanceMode}
            setDraftPerformerType={setDraftPerformerType}
            originalAttendanceMode={originalAttendanceMode}
            originalPerformerType={originalPerformerType}
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
            permissions={[ARCHIVE_PERMISSIONS.update]}
          />
          {!isEditing ? (
            <DeleteInfoButton
              production_id_url={production.id_url}
              language={language}
            />
          ) : null}
        </div>
      ) : (
        <div className="fixed right-6 bottom-6 z-50 flex gap-3">
          <EditButton
            action={t("productionPage.edit.add")}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            originalInfo={null}
            setDraftInfo={setDraftInfo}
            originalTags={originalTags}
            setDraftTags={setDraftTags}
            originalEvents={originalEvents}
            setDraftEvents={setDraftEvents}
            setNewEvents={setNewEvents}
            setDeletedEvents={setDeletedEvents}
            setDraftAttendanceMode={setDraftAttendanceMode}
            setDraftPerformerType={setDraftPerformerType}
            originalAttendanceMode={originalAttendanceMode}
            originalPerformerType={originalPerformerType}
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
            permissions={[ARCHIVE_PERMISSIONS.update]}
          />
        </div>
      )}
    </div>
  );
}
