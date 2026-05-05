import type { Delta } from "quill";
import { useTranslation } from "react-i18next";
import { ArchiveRichTextFieldWrapper } from "~/shared/components/ArchiveRichTextFieldWrapper"; 
import { Protected } from "~/features/auth";
import { useEffect, useState } from "react";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";

type Field = "teaser" | "description" | "info";

type ProductionInfoSectionProps = {
  prodinfo_available: boolean;
  tagline: string;
  teaserHtml: string | undefined;
  descriptionHtml: string | undefined;
  infoHtml: string | undefined;
  onSave: (field: Field, html: string) => void
};

async function htmlToDelta(html: string): Promise<Delta> {
  const { default: Quill } = await import("quill");
  const container = document.createElement("div");
  const quill = new Quill(container);
  quill.clipboard.dangerouslyPasteHTML(html);
  return quill.getContents();
}

async function deltaToHtml(delta: Delta): Promise<string> {
  const { default: Quill } = await import("quill");
  const container = document.createElement("div");
  const quill = new Quill(container);
  quill.setContents(delta);
  return quill.root.innerHTML;
}

type ComplexEditableFieldProps = {
  id: string;
  field: Field;
  html: string | undefined;
  fallback?: React.ReactNode;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (html: string) => void;
  onCancel: () => void;
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
      className="opacity-90 cursor-pointer rounded hover:outline hover:outline-1 hover:outline-archive-accent"
      onClick={onStartEdit}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : fallback}
    </div>
  );
}

export function ProductionInfoSection({
  prodinfo_available,
  tagline,
  teaserHtml,
  descriptionHtml,
  infoHtml,
  onSave,
}: ProductionInfoSectionProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Field | null>(null);

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
        onStartEdit={() => setEditing("teaser")}
        onSave={(html) => handleSave("teaser", html)}
        onCancel={() => setEditing(null)}
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noTeaser")}</p>
        }
      />

      <ComplexEditableField
        id="description"
        field="description"
        html={descriptionHtml}
        isEditing={editing === "description"}
        onStartEdit={() => setEditing("description")}
        onSave={(html) => handleSave("description", html)}
        onCancel={() => setEditing(null)}
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noDescription")}</p>
        }
      />

      <ComplexEditableField
        id="info"
        field="info"
        html={infoHtml}
        isEditing={editing === "info"}
        onStartEdit={() => setEditing("info")}
        onSave={(html) => handleSave("info", html)}
        onCancel={() => setEditing(null)}
        fallback={
          <p className="opacity-75">{t("productionPage.fallback.noInfo")}</p>
        }
      />
    </>
  );
}