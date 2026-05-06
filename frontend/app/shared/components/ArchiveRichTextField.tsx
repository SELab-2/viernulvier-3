import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { useQuill } from "react-quilljs";
import type { SxProps, Theme } from "@mui/material/styles";
import "quill/dist/quill.snow.css";
import type { Delta } from "quill";

type Props = {
  label?: string;
  value?: Delta | null;
  onChange: (value: Delta) => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
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

function isSameDelta(a: Delta, b: Delta) {
  if (a.ops.length !== b.ops.length) return false;
  return JSON.stringify(a.ops) === JSON.stringify(b.ops);
}

export function ArchiveRichTextField({
  label,
  value,
  onChange,
  placeholder,
  sx,
}: Props) {
  const { quill, quillRef } = useQuill({
    theme: "snow",
    placeholder: placeholder,
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
      ],
    },
  });

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!quill) return;
    const handler = () => onChangeRef.current(quill.getContents());
    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [quill]);

  useEffect(() => {
    if (!quill) return;
    if (!value) {
      quill.setContents([], "silent");
      return;
    }
    const current = quill.getContents();

    if (!isSameDelta(current, value)) {
      const selection = quill.getSelection();

      quill.setContents(value, "silent");

      if (selection) {
        const length = quill.getLength();
        const safeIndex = Math.min(selection.index, length - 1);

        quill.setSelection(safeIndex, selection.length);
      }
    }
  }, [quill, value]);

  useEffect(() => {
    if (!quill || !label) return;
    quill.root.setAttribute("aria-label", label);
  }, [quill, label]);

  return (
    <Box sx={toSxArray(sx)}>
      <div ref={quillRef} />
    </Box>
  );
}
