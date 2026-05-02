import { Link, useBlocker, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";

import type {
  Production,
  ProductionInfo,
} from "~/features/archive/types/productionTypes";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { EventCard, type EventWithResolvedRelations } from "../components/EventCard";
import { ProductionPageMediaGallery } from "../components/ProductionPageMediaGallery";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { updateProductionByUrl } from "../services/productionService";

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

function isFieldModified(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
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

async function handleInfoAdd() {}

async function handleInfoSave(
  production_id_url: string,
  originalInfo: ProductionInfo | null,
  draftInfo: ProductionInfo | null,
  setOriginalInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>,
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>,
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>,
  language: string
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

    // sync local "source of truth"
    setOriginalInfo(draftInfo);

    setIsEditing(false);
  } catch (err) {
    window.alert(`Save failed: ${err}`);
  } finally {
    setIsSaving(false);
  }
}

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

async function handleInfoDelete(production_id_url: string, language: string, confirmeMessage: string) {
  const confirmed = window.confirm(confirmeMessage);
  if (!confirmed) return;
  try {
    await updateProductionByUrl(production_id_url, {
      remove_languages: [language],
    });
    window.location.reload();
  } catch (err) {
    window.alert(`Deletion of info failed: ${err}`);
  }
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
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  renderView: (value: string) => React.ReactNode;
  isModified: boolean;
};
// <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
// </Protected>
export function SimpleEditableField({
  label,
  value,
  isEditing,
  onChange,
  renderView,
  isModified,
}: SimpleEditableFieldProps) {
  const normal_view = <>{renderView(value)}</>;
  const { t } = useTranslation();

  if (isEditing) {
    return (
      <Protected permissions={[ARCHIVE_PERMISSIONS.update]} fallback={normal_view}>
        <div
          className={`bg-archive-ink/50 bg-archive-ink-dark/60 mb-1 rounded-2xl border p-4 backdrop-blur-md transition ${isModified ? "border-archive-accent border-l-10" : "border-archive-ink/5 border-archive-ink-dark/5"} `}
        >
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-archive-ink/70 dark:text-archive-paper/70 text-xs font-bold tracking-[0.2em] uppercase">
              {label}
            </h3>

            {isModified && (
              <span className="text-archive-paper text-[10px] tracking-widest uppercase opacity-80">
                {t("productionPage.edit.modified")}
              </span>
            )}
          </div>

          {/* Input */}
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-archive-paper border-archive-ink/10 focus:ring-archive-accent/40 focus:border-archive-accent w-full rounded-lg border px-3 py-2 text-sm focus:ring-4 focus:outline-none`}
          />
        </div>
      </Protected>
    );
  }

  return normal_view;
}

type ProductionHeaderProps = {
  production_info: ProductionInfo | null;
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
    t("productionPage.infoNotAvailable")
  );

  if (production_info === null) {
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
          <h1 id="title" className="mt-2 font-serif text-5xl leading-[1.03] text-[#f0e4d3] md:text-7xl">
            {title}
          </h1>
        </div>
      </section>
    );
  }

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
          label={t("productionPage.edit.supertitle")}
          value={draftInfo?.supertitle ?? ""}
          isEditing={isEditing}
          isModified={isFieldModified(originalInfo?.supertitle, draftInfo?.supertitle)}
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
              {getTextOrDefault(value, t("productionPage.fallback.archive"))}
            </p>
          )}
        />
        <SimpleEditableField
          label={t("productionPage.edit.title")}
          value={draftInfo?.title ?? ""}
          isEditing={isEditing}
          isModified={isFieldModified(originalInfo?.title, draftInfo?.title)}
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
              {getTextOrDefault(value, t("productionPage.fallback.unknownProduction"))}
            </h1>
          )}
        />
        <SimpleEditableField
          label={t("productionPage.edit.artist")}
          value={draftInfo?.artist ?? ""}
          isEditing={isEditing}
          isModified={isFieldModified(originalInfo?.artist, draftInfo?.artist)}
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
              {getTextOrDefault(value, t("productionPage.fallback.defaultArtist"))}
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

const Spinner = () => (
  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
);

type AddInfoButtonProps = {
  language: string;
}

function AddInfoButton({ language }: AddInfoButtonProps) {
  const { t } = useTranslation();
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
    <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
      <button
        id="add-production-button"
        onClick={() => handleInfoAdd()}
        className={`${shared_css} bg-archive-accent`}
      >
        {t("productionPage.add.add")}
      </button>
    </Protected>
  );
}

type EditButtonProps = {
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  originalInfo: ProductionInfo | null;
  setDraftInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
  enable_save: boolean;
  is_saving: boolean;
  _handleSave: () => Promise<void>;
};

function EditButton({
  isEditing,
  setIsEditing,
  originalInfo,
  setDraftInfo,
  enable_save,
  is_saving,
  _handleSave,
}: EditButtonProps) {
  const { t } = useTranslation();
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
    <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
      {!isEditing ? (
        <button
          id="edit-production-button"
          onClick={() => setIsEditing(true)}
          className={`${shared_css} bg-archive-accent`}
        >
          {t("productionPage.edit.edit")}
        </button>
      ) : (
        <div id="edit-actions" className="flex gap-3">
          <button
            id="cancel-edit-production-button"
            onClick={() => {
              // Copy (not by reference)
              setDraftInfo(originalInfo ? { ...originalInfo } : null);
              setIsEditing(false);
            }}
            className={`${shared_css} bg-gray-300`}
          >
            {t("productionPage.edit.cancel")}
          </button>

          <button
            id="save-edit-production-button"
            onClick={_handleSave}
            className={` ${shared_css} bg-archive-accent disabled:hover:bg-archive-accent flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40`}
            disabled={!enable_save || is_saving}
          >
            {is_saving ? <Spinner /> : t("productionPage.edit.save")}
          </button>
        </div>
      )}
    </Protected>
  );
}

type DeleteInfoButtonProps = {
  production_id_url: string;
  language: string;
}

function DeleteInfoButton({ production_id_url, language }: DeleteInfoButtonProps) {
  const { t } = useTranslation();
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
    <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
      <button
        id="delete-production-button"
        onClick={() => handleInfoDelete(production_id_url, language, t("productionPage.delete.confirm"))}
        className={`${shared_css} bg-archive-accent`}
      >
        {t("productionPage.delete.delete")}
      </button>
    </Protected>
  );
}

type ProductionInfoSectionProps = {
  prodinfo_available: boolean;
  tagline: string;
  teaserHtml: string | undefined;
  descriptionHtml: string | undefined;
  infoHtml: string | undefined;
};

function ProductionInfoSection({
  prodinfo_available,
  tagline,
  teaserHtml,
  descriptionHtml,
  infoHtml,
}: ProductionInfoSectionProps) {
  const { t } = useTranslation();

  if (!prodinfo_available) {
    return (
      <p id="no-prodinfo" className="opacity-75">
        {t("productionPage.infoNotAvailable")}
      </p>
    );
  }
  return (
    <>
      {tagline && <p id="tagline">{tagline}</p>}

      {teaserHtml && (
        <div
          id="teaser"
          className="opacity-90"
          dangerouslySetInnerHTML={{ __html: teaserHtml }}
        />
      )}

      {descriptionHtml && (
        <div
          id="description"
          className="opacity-90"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}

      {infoHtml ? (
        <div
          id="info"
          className="opacity-90"
          dangerouslySetInnerHTML={{ __html: infoHtml }}
        />
      ) : (
        <p id="info" className="opacity-75">
          {t("productionPage.fallback.noInfo")}
        </p>
      )}
    </>        
  )
}

export function ProductionPage({ production, preferredLanguage }: ProductionPageProps) {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();

  const language = preferredLanguage ?? lang!;
  const productionInfo = getProductionInfoByLanguage(
    production.production_infos,
    language
  );

  const [mediaImageUrlsByProductionId] = useState<Record<string, string[]>>({});
  const [eventsWithDetails, setEventsWithDetails] = useState<
    EventWithResolvedRelations[]
  >([]);

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
      language
    );

  // State when editing, keeps track if something has changed
  // (to enable save button)
  const isModified = useMemo(
    () => isInfoModified(originalInfo, draftInfo),
    [originalInfo, draftInfo]
  );

  // Prevent moving away from page when edit is modified (browser aways)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isEditing && isModified) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing, isModified]);
  // And the same but for React links
  useUnsavedChangesBlocker(isEditing && isModified);

  const title = getTextOrDefault(
    productionInfo?.title,
    t("productionPage.fallback.unknownProduction")
  );
  const tagline = getTextOrDefault(productionInfo?.tagline, "");
  const teaserHtml = getSanitizedHtmlOrUndefined(productionInfo?.teaser);
  const descriptionHtml = getSanitizedHtmlOrUndefined(productionInfo?.description);
  const infoHtml = getSanitizedHtmlOrUndefined(productionInfo?.info);

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
  }, [production.event_id_urls, i18n.resolvedLanguage]);

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
            <ProductionInfoSection
              prodinfo_available={productionInfo !== null}
              tagline={tagline}
              teaserHtml={teaserHtml}
              descriptionHtml={descriptionHtml}
              infoHtml={infoHtml}
            />

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

      {productionInfo !== null ? (
        <div className="fixed right-6 bottom-6 z-50 flex gap-3">
          <EditButton
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            originalInfo={originalInfo}
            setDraftInfo={setDraftInfo}
            enable_save={isModified}
            is_saving={isSaving}
            _handleSave={_handleSave}
          />
          {!isEditing ? ( 
            <DeleteInfoButton production_id_url={production.id_url} language={language} /> 
          ) : 
            null
          }
        </div>
      ) : (
        <div className="fixed right-6 bottom-6 z-50 flex gap-3">
          <AddInfoButton language={""}/>
        </div>
      )}
    </div>
  );
}
