import { lazy, Suspense } from "react";
import type { Delta } from "quill";

const ArchiveRichTextField = lazy(() =>
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
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <ArchiveRichTextField {...props} />
    </Suspense>
  );
}