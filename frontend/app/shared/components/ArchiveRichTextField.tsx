import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import "quill/dist/quill.snow.css";
import type { Delta } from "quill";

type Props = {
  label?: string;
  value?: Delta | null;
  onChange: (value: Delta) => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
  canEdit: boolean;
};

const archiveRichTextFieldSx: SxProps<Theme> = {
  "borderRadius": "0.5rem",
  "backgroundColor": "var(--archive-surface)",
  "border": "1px solid var(--archive-border)",
  "transition": "border-color 160ms ease, background-color 160ms ease",

  "&:hover": {
    backgroundColor: "var(--archive-control)",
  },

  "&:focus-within": {
    borderColor: "var(--archive-accent)",
  },

  "& .ql-toolbar": {
    border: "none",
    borderBottom: "1px solid var(--archive-border)",
  },

  "& .ql-container": {
    border: "none",
    fontFamily: "var(--font-sans)",
    fontSize: "0.875rem",
    color: "var(--archive-ink)",
    minHeight: "150px",
  },

  "& .ql-editor": {
    padding: "0.75rem",
  },

  "& .ql-toolbar button": {
    color: "var(--archive-ink)",
  },
  "& .ql-toolbar button:hover": {
    color: "var(--archive-accent)",
  },

  "& .ql-toolbar button.ql-active": {
    color: "var(--archive-accent)",
  },

  "& .ql-editor.ql-blank::before": {
    color: "color-mix(in srgb, var(--archive-ink) 55%, transparent) !important",
    fontFamily: "var(--font-sans)",
    fontSize: "0.875rem",
    fontStyle: "normal",
  },
};

function toSxArray(sx: SxProps<Theme> | undefined) {
  if (Array.isArray(sx)) {
    return [archiveRichTextFieldSx, ...sx];
  }

  if (sx) {
    return [archiveRichTextFieldSx, sx];
  }

  return archiveRichTextFieldSx;
}

export function ArchiveRichTextField({
  label,
  value,
  onChange,
  placeholder,
  sx,
  canEdit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<InstanceType<typeof import("quill").default> | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    import("quill").then(({ default: Quill }) => {
      if (!containerRef.current) return;

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        readOnly: !canEdit,
        placeholder,
        modules: {
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
          ],
        },
      });

      quillRef.current = quill;

      quill.on("text-change", () => {
        onChangeRef.current(quill.getContents());
      });

      if (value) {
        quill.setContents(value, "silent");
      }

      if (label) {
        quill.root.setAttribute("aria-label", label);
      }
    });

    return () => {
      quillRef.current = null;
    };
    // Disable is needed because quill has to be rendered only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync value changes
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (!value) {
      quill.setContents([], "silent");
      return;
    }
    const current = quill.getContents();
    if (JSON.stringify(current.ops) !== JSON.stringify(value.ops)) {
      const selection = quill.getSelection();
      quill.setContents(value, "silent");
      if (selection) {
        const safeIndex = Math.min(selection.index, quill.getLength() - 1);
        quill.setSelection(safeIndex, selection.length);
      }
    }
  }, [value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (canEdit) {
      quill.enable();
    } else {
      quill.disable();
    }
  }, [canEdit]);

  return (
    <Box sx={toSxArray(sx)}>
      <div ref={containerRef} />
    </Box>
  );
}
