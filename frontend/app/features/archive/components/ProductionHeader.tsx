import { useTranslation } from "react-i18next";
import type { ProductionInfo } from "../types/productionTypes";
import SimpleEditableField from "~/shared/components/SimpleEditableField";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { getTextOrDefault } from "../utils/productionPageFunctions";

function isFieldModified(
  original: string | undefined,
  draft: string | undefined
): boolean {
  return (original ?? "") !== (draft ?? "");
}

type ProductionHeaderProps = {
  isCreateHeader: boolean;
  image_url: string;
  isEditing: boolean;
  originalInfo: ProductionInfo | null;
  draftInfo: ProductionInfo | null;
  setDraftInfo: React.Dispatch<React.SetStateAction<ProductionInfo | null>>;
};

/* ProductionHeader contains main image, supertitle, title and artist */
export function ProductionHeader({
  isCreateHeader,
  image_url,
  isEditing,
  originalInfo,
  draftInfo,
  setDraftInfo,
}: ProductionHeaderProps) {
  const { t } = useTranslation();
  const hasImage = Boolean(image_url);

  const effectiveIsEditing = isCreateHeader || isEditing;

  const modified = (orig: string | undefined, draft: string | undefined) =>
    !isCreateHeader && isFieldModified(orig, draft);

  const permissions = isCreateHeader
    ? [ARCHIVE_PERMISSIONS.create]
    : [ARCHIVE_PERMISSIONS.update];

  return (
    <section
      id="production-header"
      className="relative overflow-hidden rounded-[2rem] border border-[color:color-mix(in_srgb,var(--archive-accent)_12%,transparent)] bg-black/30"
    >
      {hasImage ? (
        <img
          src={image_url}
          alt={originalInfo?.title ?? ""}
          className="h-[280px] w-full object-cover object-center md:h-[360px]"
        />
      ) : (
        <div className="flex h-[280px] w-full items-center justify-center bg-black/60 md:h-[360px]"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
      <div className="absolute right-7 bottom-4 left-7 md:right-12 md:bottom-10 md:left-12">
        <SimpleEditableField
          label={t("productionPage.edit.supertitle")}
          value={draftInfo?.supertitle ?? ""}
          placeholder={t("archive.add_info.supertitle")}
          isEditing={effectiveIsEditing}
          isModified={modified(originalInfo?.supertitle, draftInfo?.supertitle)}
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
          permissions={permissions}
        />
        <SimpleEditableField
          label={t("productionPage.edit.title")}
          value={draftInfo?.title ?? ""}
          placeholder={t("archive.add_info.title")}
          isEditing={effectiveIsEditing}
          isModified={modified(originalInfo?.title, draftInfo?.title)}
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
          permissions={permissions}
        />
        <SimpleEditableField
          label={t("productionPage.edit.artist")}
          value={draftInfo?.artist ?? ""}
          placeholder={t("archive.add_info.artist")}
          isEditing={effectiveIsEditing}
          isModified={modified(originalInfo?.artist, draftInfo?.artist)}
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
          permissions={permissions}
        />
      </div>
    </section>
  );
}
