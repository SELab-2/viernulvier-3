import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState } from "react";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { EventCard, type EventWithResolvedRelations } from "./EventCard";
import { ProductionPageMediaGallery } from "./ProductionPageMediaGallery";

interface ProductionPageProps {
  production: Production;
  preferredLanguage?: string;
}

function getProductionInfoByLanguage(
  productionInfos: ProductionInfo[],
  language: string
): ProductionInfo {
  const languageMatch = productionInfos.find((info) => info.language === language);
  if (languageMatch) {
    return languageMatch;
  }

  // fallback to dutch first, then fallback to first available translation
  const defaultMatch = productionInfos.find((info) => info.language === "nl");
  return defaultMatch ?? productionInfos[0];
}

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
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

function isFieldDirty(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
}

function isInfoDirty(
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

type SimpleEditableFieldProps = {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  renderView: (value: string) => React.ReactNode;
  isDirty: boolean;
};
// <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
// </Protected>
export function SimpleEditableField({
  value,
  isEditing,
  onChange,
  renderView,
  isDirty,
}: SimpleEditableFieldProps) {
  if (isEditing) {
    const border_style = isDirty
      ? "border-l-4 border-l-orange-400 border-white/20"
      : "border-white/30 bg-black/70";
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-md border ${border_style} focus:ring-archive-accent bg-black/70 px-2 py-1 text-white placeholder-white/40 focus:ring-2 focus:outline-none`}
      />
    );
  }

  return <>{renderView(value)}</>;
}

type ProductionHeaderProps = {
  production_info: ProductionInfo;
  image_url: string;
  isEditing: boolean;
  originalInfo: ProductionInfo | null;
  draftInfo: ProductionInfo | null;
  setDraftInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
};

/* ProductionHeader contains main image, supertitle, title and artist */
function ProductionHeader({
  production_info,
  image_url,
  isEditing,
  originalInfo,
  draftInfo,
  setDraftInfo,
}: ProductionHeaderProps) {
  const { t } = useTranslation();
  const title = getTextOrDefault(
    production_info?.title,
    t("productionPage.fallback.unknownProduction")
  );

  return (
    <section
      id="production-header"
      className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30"
    >
      <img
        src={image_url}
        alt={title}
        className="h-[280px] w-full object-cover object-center md:h-[360px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute right-7 bottom-8 left-7 md:right-12 md:bottom-10 md:left-12">
        <SimpleEditableField
          value={draftInfo?.supertitle ?? ""}
          isEditing={isEditing}
          isDirty={isFieldDirty(originalInfo?.supertitle, draftInfo?.supertitle)}
          onChange={(newValue) => {
            setDraftInfo((prev) => {
              // Overwrite supertitle
              if (prev) return { ...prev, supertitle: newValue };
              // !prev => prev ~= null => simple not initialised yet
              else return prev;
            });
          }}
          renderView={(value) => (
            <p
              id="supertitle"
              className="font-sans text-[0.65rem] tracking-[0.28em] text-white/72 uppercase"
            >
              {getTextOrDefault(value, "")}
            </p>
          )}
        />
        <SimpleEditableField
          value={draftInfo?.title ?? ""}
          isEditing={isEditing}
          isDirty={isFieldDirty(originalInfo?.title, draftInfo?.title)}
          onChange={(newValue) => {
            setDraftInfo((prev) => {
              // Overwrite title
              if (prev) return { ...prev, title: newValue };
              else return prev;
            });
          }}
          renderView={(value) => (
            <h1
              id="title"
              className="mt-2 font-serif text-5xl leading-[1.03] text-[#f0e4d3] md:text-7xl"
            >
              {value}
            </h1>
          )}
        />
        <SimpleEditableField
          value={draftInfo?.artist ?? ""}
          isEditing={isEditing}
          isDirty={isFieldDirty(originalInfo?.artist, draftInfo?.artist)}
          onChange={(newValue) => {
            setDraftInfo((prev) => {
              if (prev) return { ...prev, artist: newValue };
              else return prev;
            });
          }}
          renderView={(value) => (
            <p
              id="artist"
              className="archive-artist-chic mt-2 text-xl text-[#f0e4d3]/90 md:text-2xl"
            >
              {value}
            </p>
          )}
        />
      </div>
    </section>
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
            <EventCard event={event} />
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

type EditButtonProps = {
  production_id_url: string;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  originalInfo: ProductionInfo | null;
  draftInfo: ProductionInfo | null;
  setDraftInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
  setOriginalInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
  enable_save: boolean;
};

function EditButton({
  production_id_url,
  isEditing,
  setIsEditing,
  originalInfo,
  draftInfo,
  setDraftInfo,
  setOriginalInfo,
  enable_save,
}: EditButtonProps) {
  const shared_css = `
	shadow-lg
	hover:bg-archive-control-hover
	rounded-full
	cursor-pointer
	transition-colors
	duration-150
	text-archive-ink
	inline-flex
	px-6 py-3
	font-semibold text-white
  `;
  return (
    <>
      {!isEditing ? (
        <button
          id="edit-production-button"
          onClick={() => setIsEditing(true)}
          className={`${shared_css} bg-archive-accent fixed right-6 bottom-6 z-50`}
        >
          Edit
        </button>
      ) : (
        <div id="edit-actions" className="fixed right-6 bottom-6 z-50 flex gap-3">
          <button
            id="cancel-edit-production-button"
            onClick={() => {
              setDraftInfo(originalInfo);
              setIsEditing(false);
            }}
            className={`${shared_css} bg-gray-300`}
          >
            Cancel
          </button>

          <button
            id="save-edit-production-button"
            onClick={() => {
              console.log("Saving draft:", draftInfo);
              handleSave(
                production_id_url,
                originalInfo,
                draftInfo,
                setOriginalInfo,
                setIsEditing
              );
            }}
            className={` ${shared_css} bg-archive-accent disabled:hover:bg-archive-accent disabled:cursor-not-allowed disabled:opacity-40`}
            disabled={!enable_save}
          >
            Save
          </button>
        </div>
      )}
    </>
  );
}

export function ProductionPage({
  production,
  preferredLanguage = "nl",
}: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const [mediaImageUrlsByProductionId] = useState<Record<string, string[]>>({});
  const [eventsWithDetails, setEventsWithDetails] = useState<
    EventWithResolvedRelations[]
  >([]);

  // States for editing the production info shown
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [originalInfo, setOriginalInfo] = useState<ProductionInfo | null>(null);
  const [draftInfo, setDraftInfo] = useState<ProductionInfo | null>(null);

  const isDirty = useMemo(
    () => isInfoDirty(originalInfo, draftInfo),
    [originalInfo, draftInfo]
  );

  const language = i18n.resolvedLanguage ?? preferredLanguage;

  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  // Initialize edit states
  useEffect(() => {
    setOriginalInfo(productionInfo);
    setDraftInfo(productionInfo);
  }, [productionInfo]);

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const tagline = getTextOrDefault(
    productionInfo?.tagline,
    t("productionPage.fallback.noDescription")
  );

  //TODO maybe an image saying no image found? Or something else? idk
  const fallbackImageUrl =
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1600&auto=format&fit=crop";

  const imageUrl =
    mediaImageUrlsByProductionId[production.id_url]?.[0] ?? fallbackImageUrl;
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
  }, [production.event_id_urls]);

  return (
    <div className="bg-archive-paper text-archive-ink min-h-screen">
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
            <p id="tagline">{tagline}</p>
            <section className="bg-archive-surface-strong mt-8 max-w-3xl rounded-[1.75rem] p-6">
              <h2 className="text-[0.68rem] tracking-[0.25em] uppercase opacity-70">
                {t("productionPage.archiveSchema")}
              </h2>

              <Events event_objects={eventObjects} />
            </section>
          </article>
        </section>

        <ProductionPageMediaGallery
          production_id_url={production.id_url}
          title={title}
        />
      </main>
      <EditButton
        production_id_url={production.id_url}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        originalInfo={originalInfo}
        setOriginalInfo={setOriginalInfo}
        draftInfo={draftInfo}
        setDraftInfo={setDraftInfo}
        enable_save={isDirty}
      />
    </div>
  );
}
