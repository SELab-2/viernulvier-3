import { lazy, Suspense, useState, useEffect } from "react";
import type { Delta } from "quill";
import { useTranslation } from "react-i18next";
import { deltaToHtml, htmlToDelta } from "~/archive-rich-text.client";
import { Protected } from "~/features/auth";
import { FiEdit2 } from "react-icons/fi";

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

type ComplexEditableFieldProps = {
  id: string;
  field: string;
  html: string | undefined;
  fallback?: React.ReactNode;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (html: string) => void;
  onCancel: () => void;
  canEdit: boolean;
  permissions: string[];
  onDirtyChange?: (isDirty: boolean) => void;
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
  permissions,
  onDirtyChange,
}: ComplexEditableFieldProps) {
  const { t } = useTranslation();
  const [delta, setDelta] = useState<Delta | null>(null);
  const [originalDelta, setOriginalDelta] = useState<Delta | null>(null);

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
      htmlToDelta(html).then((d) => {
        setDelta(d);
        setOriginalDelta(d);
      });
    } else if (isEditing) {
      setTimeout(() => {
        setDelta(null);
        setOriginalDelta(null);
      }, 0);
    } else {
      onDirtyChange?.(false);
    }
  }, [isEditing, html, onDirtyChange]);

  if (isEditing) {
    return (
      <Protected permissions={permissions}>
        <div className="flex items-center gap-2">
          <p className="font-bold underline">{field}</p>
          <FiEdit2 />
        </div>
        <div id={id}>
          <ArchiveRichTextFieldWrapper
            label={field}
            value={delta}
            onChange={(newDelta) => {
              setDelta(newDelta);
              const dirty = JSON.stringify(newDelta) !== JSON.stringify(originalDelta);
              onDirtyChange?.(dirty);
            }}
            canEdit={canEdit}
          />
          <div className="mt-2 flex gap-2">
            <button className={`${shared_css} bg-gray-300`} onClick={onCancel}>
              {t("editfield.cancel")}
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
              {t("editfield.save")}
            </button>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <div
      id={id}
      className={`w-full min-w-0 flex-1 overflow-x-hidden rounded opacity-90 ${canEdit ? "hover:outline-archive-accent flex !cursor-pointer flex-col hover:outline hover:outline-1" : "cursor-default"}`}
      onClick={onStartEdit}
    >
      {canEdit ? (
        <div className="flex items-center gap-2">
          <p className="font-bold underline">{field}</p>
          <FiEdit2 />
        </div>
      ) : null}

      {html ? (
        <div
          className="prose overflow-wrap-anywhere max-w-none min-w-0 break-words whitespace-normal"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
