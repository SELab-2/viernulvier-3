import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import ComplexEditableField, {
  type Field,
} from "~/shared/components/ArchiveRichTextFieldWrapper";

type ProductionInfoSectionProps = {
  prodinfo_available: boolean;
  tagline: string;
  teaserHtml: string | undefined;
  descriptionHtml: string | undefined;
  infoHtml: string | undefined;
  isEditing: boolean;
  onSave: (field: Field, html: string) => void;
};

export function ProductionInfoSection({
  prodinfo_available,
  tagline,
  teaserHtml,
  descriptionHtml,
  infoHtml,
  isEditing: globalIsEditing,
  onSave,
}: ProductionInfoSectionProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Field | null>(null);

  useEffect(() => {
    if (!globalIsEditing) {
      setTimeout(() => setEditing(null), 0);
    }
  }, [globalIsEditing]);

  if (!prodinfo_available) {
    return (
      <p id="no-prodinfo" className="opacity-75">
        {t("productionPage.infoNotAvailable")}
      </p>
    );
  }

  function handleSave(field: Field, html: string) {
    onSave(field, html);
    setEditing(null);
  }

  return (
    <>
      {tagline && <p id="tagline">{tagline}</p>}

      <ComplexEditableField
        id="teaser"
        field="teaser"
        html={teaserHtml}
        isEditing={editing === "teaser"}
        onStartEdit={() => globalIsEditing && setEditing("teaser")}
        onSave={(html) => handleSave("teaser", html)}
        onCancel={() => setEditing(null)}
        fallback={<p className="opacity-75">{t("productionPage.fallback.noTeaser")}</p>}
        canEdit={globalIsEditing}
      />

      <ComplexEditableField
        id="description"
        field="description"
        html={descriptionHtml}
        isEditing={editing === "description"}
        onStartEdit={() => globalIsEditing && setEditing("description")}
        onSave={(html) => handleSave("description", html)}
        onCancel={() => setEditing(null)}
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noDescription")}</p>
        }
        canEdit={globalIsEditing}
      />

      <ComplexEditableField
        id="info"
        field="info"
        html={infoHtml}
        isEditing={editing === "info"}
        onStartEdit={() => globalIsEditing && setEditing("info")}
        onSave={(html) => handleSave("info", html)}
        onCancel={() => setEditing(null)}
        fallback={<p className="opacity-75">{t("productionPage.fallback.noInfo")}</p>}
        canEdit={globalIsEditing}
      />
    </>
  );
}
