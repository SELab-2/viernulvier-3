import { lazy, Suspense, useState, useEffect } from "react";
import type { Delta } from "quill";

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
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Suspense fallback={<div>Laden...</div>}>
      <ArchiveRichTextFieldLazy {...props} />
    </Suspense>
  );
}