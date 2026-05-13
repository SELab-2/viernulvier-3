import { useBlocker, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import Add from "@mui/icons-material/Add";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

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
import { getAllHalls, getHallByUrl } from "~/features/archive/services/hallService";
import { EventCard, type EventWithResolvedRelations } from "../components/EventCard";
import { ProductionPageMediaGallery } from "../components/ProductionPageMediaGallery";
import { updateProductionByUrl } from "../services/productionService";
import { deleteByUrl } from "~/shared/services/sharedService";
import type { Hall } from "../types/hallTypes";
import EditableEventCard from "../components/EditableEventCard";
import { getMediaForProduction } from "~/features/archive/services/mediaService";
import { getBlogsForProduction } from "~/features/blogs/services/blogService";
import { BlogCardList } from "~/features/blogs/components/BlogCard";
import { ProductionInfoSection } from "../components/ProductionInfoSection";
import { BackToCollectionLink } from "../components/BackToCollectionLink";
import { DeleteInfoButton } from "../components/DeleteInfoButton";
import { EditButton } from "../components/EditButton";
import { ProductionHeader } from "../components/ProductionHeader";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

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

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function getSanitizedHtmlOrUndefined(
  value: string | null | undefined
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return undefined;
  }

  return DOMPurify.sanitize(trimmedValue);
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

// prefer active language, then dutch, then first available tag name
function getTagNamesByLanguage(production: Production, language: string): string[] {
  if (!production.tags || production.tags.length === 0) {
    return [];
  }

  return production.tags
    .map((tag) => {
      const languageMatch = tag.names.find((name) => name.language === language);
      if (languageMatch?.name) {
        return languageMatch.name;
      }

      const defaultMatch = tag.names.find((name) => name.language === "nl");
      return defaultMatch?.name ?? tag.names[0]?.name;
    })
    .filter((name): name is string => typeof name === "string" && name.length > 0);
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
  production_id_url: string,
  originalInfo: ProductionInfo | null,
  draftInfo: ProductionInfo | null,
  setOriginalInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>,
  draftEvents: EventWithResolvedRelations[],
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  originalEvents: EventWithResolvedRelations[],
  setOriginalEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  newEvents: EventWithResolvedRelations[],
  setNewEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  deletedEvents: EventWithResolvedRelations[],
  setDeletedEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>,
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  language: string,
  skipUnloadWarning: React.RefObject<boolean>,
  setSkipWarning: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (!draftInfo || !originalInfo) return;
  setIsSaving(true);
  try {
    await updateProductionByUrl(production_id_url, {
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
    setOriginalInfo(draftInfo);
    setOriginalEvents([...draftEvents, ...createdEvents]);
    setDraftEvents([...draftEvents, ...createdEvents]);
    setNewEvents([]);
    setDeletedEvents([]);

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

function useUnsavedChangesBlocker(when: boolean) {
  const blocker = useBlocker(when);
  const blockerRef = useRef(blocker);
  const { t } = useTranslation();

  useEffect(() => {
    blockerRef.current = blocker;
  });

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    if (blockerRef.current.state === "blocked") {
      const confirmLeave = window.confirm(tRef.current("notSaveChanges"));
      if (confirmLeave) {
        blockerRef.current.proceed();
      } else {
        blockerRef.current.reset();
      }
    }
  }, [blocker.state]);
}

type TagsProps = {
  performer_type?: string | undefined;
  tags: string[];
};

function Tags({ performer_type, tags }: TagsProps) {
  return (
    <section id="production-tags" aria-label="Production tags">
      <ul className="mt-6 flex flex-wrap gap-2">
        {/* Performer type badge */}
        {performer_type && (
          <li
            id="tag-performer-type"
            aria-label="Performer type"
            className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_40%,transparent)] px-4 py-1.5 text-[0.68rem] font-semibold tracking-[var(--archive-tracking-label)] uppercase opacity-90"
          >
            {performer_type}
          </li>
        )}

        {/* existing tags */}
        {tags.map((tag) => (
          <li
            key={tag}
            aria-label="Tag"
            className="bg-archive-control rounded-full border border-[color:color-mix(in_srgb,var(--archive-accent)_24%,transparent)] px-4 py-1.5 text-[0.68rem] tracking-[var(--archive-tracking-label)] uppercase"
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  );
}

type EventsProps = {
  event_objects: EventWithResolvedRelations[];
};
function Events({ event_objects }: EventsProps) {
  const { t } = useTranslation();

  if (event_objects.length > 0) {
    return (
      <div id="events-listing">
        <ul className="mt-6 space-y-2.5">
          {event_objects.map((event) => (
            <EventCard event={event} key={event.id_url} />
          ))}
        </ul>
      </div>
    );
  } else {
    return (
      <div id="events-listing" className="mt-6">
        <p className="mt-1 text-sm opacity-75">
          {t("productionPage.fallback.noEvents")}
        </p>
      </div>
    );
  }
}

function EditEvents({
  draftEvents,
  setDraftEvents,
  setDeletedEvents,
  halls,
  isNewEvents = false,
}: {
  draftEvents: EventWithResolvedRelations[];
  setDraftEvents: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  setDeletedEvents?: React.Dispatch<React.SetStateAction<EventWithResolvedRelations[]>>;
  halls: Hall[];
  isNewEvents?: boolean;
}) {
  return (
    <ul className="mt-6 space-y-2.5">
      {draftEvents.map((event, index) => (
        <EditableEventCard
          key={event.id_url}
          event={event}
          halls={halls}
          onChange={(updated) => {
            setDraftEvents((prev) => {
              const copy = [...prev];
              copy[index] = updated;
              return copy;
            });
          }}
          onDelete={() => {
            setDraftEvents((prev) => prev.filter((_, i) => i !== index));
            if (setDeletedEvents !== undefined) {
              setDeletedEvents((prev) => [...prev, event]);
            }
          }}
          canDeleteWithoutPerms={isNewEvents}
        />
      ))}
    </ul>
  );
}

function NewEventButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        className="bg-archive-accent hover:bg-archive-accent/90 flex items-center gap-2 rounded-full px-5 py-2.5 text-white shadow-md transition-all duration-100 active:scale-95"
      >
        <Add fontSize="small" />
        <p className="text-sm font-medium tracking-wide uppercase">
          {t("productionPage.newEvent")}
        </p>
      </button>
    </div>
  );
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
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State containing all halls so that editable event cards don't have to each fetch all the halls themselves for every event
  const [allHalls, setAllHalls] = useState<Hall[]>([]);

  const _handleSave = () =>
    handleInfoSave(
      production.id_url,
      originalInfo,
      draftInfo,
      setOriginalInfo,
      draftEvents,
      setDraftEvents,
      originalEvents,
      setOriginalEvents,
      newEvents,
      setNewEvents,
      deletedEvents,
      setDeletedEvents,
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
    return isInfoModified(originalInfo, draftInfo) || areEventsModified;
  }, [originalInfo, draftInfo, areEventsModified, isEditing]);

  // Helper to create an empty event when pressing new event button
  function createEmptyEvent(): EventWithResolvedRelations {
    return {
      id_url: "", // temporary ID
      production_id_url: production.id_url,
      starts_at: "",
      ends_at: "",
      order_url: "",
      price_urls: [],
      resolvedHall: undefined,
      resolvedPrices: [],
    };
  }

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
  const tags = getTagNamesByLanguage(production, language);
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

  // Load list of all halls for autocomplete in editing
  useEffect(() => {
    if (isEditing) {
      const loadHalls = async () => {
        const halls = await getAllHalls();
        setAllHalls(halls);
      };
      loadHalls();
    }
  }, [isEditing]);
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
          production_info={productionInfo}
          image_url={imageUrl}
          isEditing={isEditing}
          originalInfo={originalInfo}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
        />

        <Tags performer_type={production.performer_type} tags={tags} />

        <section id="production-events" className="mt-8">
          <article className="w-full min-w-0 space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <ProductionInfoSection
              tagline={draftInfo?.tagline ?? ""}
              originalTagline={originalInfo?.tagline ?? undefined}
              teaserHtml={teaserHtml}
              descriptionHtml={descriptionHtml}
              infoHtml={infoHtml}
              isEditing={isEditing}
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
            />

            <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
              <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                {t("productionPage.archiveSchema")}
              </h2>

              {isEditing ? (
                <>
                  {/* Events that are being edited */}
                  <EditEvents
                    draftEvents={draftEvents}
                    setDraftEvents={setDraftEvents}
                    setDeletedEvents={setDeletedEvents}
                    halls={allHalls}
                  />
                  {/* Events that are being newly created */}
                  <EditEvents
                    draftEvents={newEvents}
                    setDraftEvents={setNewEvents}
                    halls={allHalls}
                    isNewEvents={true}
                  />
                  <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
                    <NewEventButton
                      onClick={() => {
                        setNewEvents((prev) => [...prev, createEmptyEvent()]);
                      }}
                    />
                  </Protected>
                </>
              ) : (
                <Events event_objects={eventObjects} />
              )}
            </section>

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
            originalEvents={originalEvents}
            setDraftEvents={setDraftEvents}
            setNewEvents={setNewEvents}
            setDeletedEvents={setDeletedEvents}
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
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
            originalEvents={originalEvents}
            setDraftEvents={setDraftEvents}
            setNewEvents={setNewEvents}
            setDeletedEvents={setDeletedEvents}
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
          />
        </div>
      )}
    </div>
  );
}
