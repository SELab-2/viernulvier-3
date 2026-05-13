import { useTranslation } from "react-i18next";
import type { ProductionInfo } from "../types/productionTypes";
import SimpleEditableField from "~/shared/components/SimpleEditableField";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

function getTextOrDefault(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallback;
}

function isFieldModified(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
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
export default function ProductionHeader({
  production_info,
  image_url,
  isEditing,
  originalInfo,
  draftInfo,
  setDraftInfo,
}: ProductionHeaderProps) {
  const { t } = useTranslation();

  return (
    <section
      id="production-header"
      className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30"
    >
      <img
        src={image_url}
        alt={production_info?.title}
        className="h-[280px] w-full object-cover object-center md:h-[360px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute right-7 bottom-4 left-7 md:right-12 md:bottom-10 md:left-12">
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
          permissions={[ARCHIVE_PERMISSIONS.update]}
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
          permissions={[ARCHIVE_PERMISSIONS.update]}
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
          permissions={[ARCHIVE_PERMISSIONS.update]}
        />
      </div>
    </section>
  );
}
