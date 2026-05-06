import type { Delta } from "quill";
import { useTranslation } from "react-i18next";
import { htmlToDelta, deltaToHtml } from "~/archive-rich-text.client";
import { ArchiveRichTextFieldWrapper } from "~/shared/components/ArchiveRichTextFieldWrapper"; 
import { Protected } from "~/features/auth";
import { useEffect, useState } from "react";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

type Field = "teaser" | "description" | "info";

type ComplexEditableFieldProps = {
  id: string;
  field: Field;
  html: string | undefined;
  fallback?: React.ReactNode;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (html: string) => void;
  onCancel: () => void;
  canEdit: boolean;
};

function ComplexEditableField({
  id,
  field,
  html,
  fallback,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  canEdit,
}: ComplexEditableFieldProps) {
  const { t } = useTranslation();
  const [delta, setDelta] = useState<Delta | null>(null);

  useEffect(() => {
  if (isEditing && html) {
    htmlToDelta(html).then(setDelta);
  } else if (isEditing) {
    setDelta(null);
  }
  }, [isEditing]);

  if (isEditing) {
    return (
      <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
        <div id={id}>
            <ArchiveRichTextFieldWrapper
                label={field}
                value={delta}
                onChange={setDelta}
                canEdit={canEdit}
            />
            <div className="flex gap-2 mt-2">
            <button
                onClick={async () => {
                  if (delta) {
                    const html = await deltaToHtml(delta);
                    onSave(html);
                  }
                }}
                            >
                {t("productionPage.edit.save")}
            </button>
            <button onClick={onCancel}>{t("productionPage.edit.cancel")}</button>
            </div>
        </div>
      </Protected>
    )
  }

  return (
    <div
      id={id}
      className={`opacity-90 rounded ${canEdit ? "!cursor-pointer hover:outline hover:outline-1 hover:outline-archive-accent" : "!cursor-default"}`}
      onClick={onStartEdit}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : fallback}
    </div>
  );
}

type ProductionInfoSectionProps = {
  prodinfo_available: boolean;
  tagline: string;
  teaserHtml: string | undefined;
  descriptionHtml: string | undefined;
  infoHtml: string | undefined;
  isEditing: boolean;
  onSave: (field: Field, html: string) => void
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
    if (!globalIsEditing) setEditing(null);
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
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noTeaser")}</p>
        }
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
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noInfo")}</p>
        }
        canEdit={globalIsEditing}
      />
    </>
  );
}