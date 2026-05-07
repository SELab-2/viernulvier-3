import { lazy, Suspense, useState, useEffect } from "react";
import type { Delta } from "quill";
import { useTranslation } from "react-i18next";
import { deltaToHtml, htmlToDelta } from "~/archive-rich-text.client";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";
import { FiEdit2 } from 'react-icons/fi'

const ArchiveRichTextFieldLazy = lazy(() =>
  import("./ArchiveRichTextField").then((m) => ({
    default: m.ArchiveRichTextField,
  }))
);

export function ArchiveRichTextFieldWrapper(props: {
  label?: string;
  value?: Delta | null;
  onChange: (value: Delta) => void;
  placeholder?: string;
  canEdit: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const { t } = useTranslation();

  if (!mounted) return null;

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <ArchiveRichTextFieldLazy {...props} />
    </Suspense>
  );
}

export type Field = "teaser" | "description" | "info";

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

export default function ComplexEditableField({
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

  useEffect(() => {
    if (isEditing && html) {
      htmlToDelta(html).then(setDelta);
    } else if (isEditing) {
      setTimeout(() => setDelta(null), 0);
    }
  }, [isEditing, html]);

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
          <div className="mt-2 flex gap-2">
            <button className={`${shared_css} bg-gray-300`} onClick={onCancel}>
              {t("productionPage.edit.cancel")}
            </button>
            <button
              className={`${shared_css} bg-archive-accent`}
              onClick={async () => {
                if (delta) {
                  const html = await deltaToHtml(delta);
                  onSave(html);
                }
              }}
            >
              {t("productionPage.edit.save")}
            </button>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <div
      id={id}
      className={`rounded opacity-90 ${canEdit ? "className=flex items-center gap-2 hover:outline-archive-accent !cursor-pointer hover:outline hover:outline-1" : "!cursor-default"}`}
      onClick={onStartEdit}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : fallback}
      {canEdit ? <FiEdit2 /> : null}
    </div>
  );
}
