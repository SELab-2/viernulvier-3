import { Link, useBlocker, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { Blog } from "~/features/blogs/types/blogTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { EventCard, type EventWithResolvedRelations } from "../components/EventCard";
import { ProductionPageMediaGallery } from "../components/ProductionPageMediaGallery";
import { updateProductionByUrl } from "../services/productionService";
import { getMediaForProduction } from "~/features/archive/services/mediaService";
import { getBlogsForProduction } from "~/features/blogs/services/blogService";
import { BlogCardList } from "~/features/blogs/components/BlogCard";
import { ProductionInfoSection } from "../components/ProductionInfoSection";

import DeleteInfoButton from "../components/DeleteInfoButton";
import EditButton from "../components/EditButton";
import ProductionHeader from "../components/ProductionHeader";

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

async function handleInfoSave(
  production_id_url: string,
  originalInfo: ProductionInfo | null,
  draftInfo: ProductionInfo | null,
  setOriginalInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>,
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  language: string,
  skipUnloadWarning: React.RefObject<boolean>,
  setSkipWarning: React.Dispatch<React.SetStateAction<boolean>>
) {
  if (!draftInfo) return;

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

    // sync local "source of truth"
    setOriginalInfo(draftInfo);

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

function BackToCollectionLink() {
  const { t } = useTranslation();
  const lp = useLocalizedPath();
  return (
    <Link
      id="back-to-collection"
      to={lp("/archive")}
      className="font-sans text-[0.68rem] tracking-[0.24em] uppercase no-underline opacity-70 transition hover:opacity-100"
    >
      {t("productionPage.backToCollection")}
    </Link>
  );
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

export function ProductionPage({ production, preferredLanguage }: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();

  const language = preferredLanguage ?? lang!;
  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  const [firstImageUrl, setFirstImageUrl] = useState<string | undefined>(undefined);
  const [eventsWithDetails, setEventsWithDetails] = useState<
    EventWithResolvedRelations[]
  >([]);
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

  const _handleSave = () =>
    handleInfoSave(
      production.id_url,
      originalInfo,
      draftInfo,
      setOriginalInfo,
      setIsEditing,
      setIsSaving,
      language,
      skipUnloadWarning,
      setSkipWarning
    );

  // State when editing, keeps track if something has changed
  // (to enable save button)
  const isModified = useMemo(() => {
    if (originalInfo === null) {
      return isEditing; // With add always true.
    }
    return isInfoModified(originalInfo, draftInfo);
  }, [originalInfo, draftInfo, isEditing]);

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

  // Prevent moving away from page when edit is modified (browser aways)
  // Browser does not show warning when saving.
  const skipUnloadWarning = useRef(false);
  const [skipWarning, setSkipWarning] = useState(false);
  const [isQuillDirty, setIsQuillDirty] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (skipUnloadWarning.current) return;
      if (isEditing && (isModified || isQuillDirty)) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing, isModified, isQuillDirty]);

  // And the same but for React links
  useUnsavedChangesBlocker(isEditing && (isModified || isQuillDirty) && !skipWarning);

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const tagline = getTextOrDefault(productionInfo?.tagline, "");
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
      eventsWithDetails.slice().sort((leftEvent, rightEvent) => {
        const startDifference =
          getEventTimestamp(leftEvent.starts_at) -
          getEventTimestamp(rightEvent.starts_at);

        if (startDifference !== 0) {
          return startDifference;
        }

        return leftEvent.id_url.localeCompare(rightEvent.id_url);
      }),
    [eventsWithDetails]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadEventDetails = async () => {
      if (!isCancelled) {
        setEventsWithDetails([]);
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
          setEventsWithDetails(
            hydratedEvents.filter(
              (event): event is EventWithResolvedRelations => event !== null
            )
          );
        }
      } catch {
        if (!isCancelled) {
          setEventsWithDetails([]);
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
          production_info={productionInfo}
          image_url={imageUrl}
          isEditing={isEditing}
          originalInfo={originalInfo}
          draftInfo={draftInfo}
          setDraftInfo={setDraftInfo}
        />

        <Tags performer_type={production.performer_type} tags={tags} />

        <section id="production-events" className="mt-8">
          <article className="space-y-6 text-[1.06rem] leading-[1.62] opacity-92">
            <ProductionInfoSection
              tagline={tagline}
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
              onQuillDirtyChange={useCallback((isDirty: boolean) => setIsQuillDirty(isDirty), [])}
            />

            <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
              <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                {t("productionPage.archiveSchema")}
              </h2>

              <Events event_objects={eventObjects} />
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
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
          />
        </div>
      )}
    </div>
  );
}
