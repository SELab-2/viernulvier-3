import { lazy, Suspense, useState, useEffect } from "react";
import type { Delta } from "quill";
import { useTranslation } from "react-i18next";

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
  useEffect(() => setMounted(true), []);
  const { t } = useTranslation()

  if (!mounted) return null;

  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <ArchiveRichTextFieldLazy {...props} />
    </Suspense>
  );
}