import { TextField, type TextFieldProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

const archiveTextFieldSx: SxProps<Theme> = {
  "& .MuiInputLabel-root": {
    fontFamily: "var(--font-sans)",
    fontSize: "0.8125rem",
    color: "color-mix(in srgb, var(--archive-ink) 55%, transparent)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "var(--archive-accent)",
  },
  "& .MuiOutlinedInput-root": {
    "fontFamily": "var(--font-sans)",
    "fontSize": "0.875rem",
    "color": "var(--archive-ink)",
    "borderRadius": "0.5rem",
    "backgroundColor": "var(--archive-surface)",
    "transition": "background-color 160ms ease, border-color 160ms ease",
    "& fieldset": {
      borderColor: "var(--archive-border)",
    },
    "&:hover": {
      backgroundColor: "var(--archive-control)",
    },
    "&:hover fieldset": {
      borderColor: "var(--archive-border-hover)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "var(--archive-accent)",
      borderWidth: "1px",
    },
  },
  "& .MuiInputBase-input": {
    color: "var(--archive-ink)",
  },
  "& .MuiInputBase-input:-webkit-autofill": {
    WebkitBoxShadow: "0 0 0 100px var(--archive-surface) inset",
    WebkitTextFillColor: "var(--archive-ink)",
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "var(--font-sans)",
    marginLeft: 0,
    color: "color-mix(in srgb, var(--archive-ink) 72%, transparent)",
  },
};

function toSxArray(sx: TextFieldProps["sx"]) {
  if (Array.isArray(sx)) {
    return [archiveTextFieldSx, ...sx];
  }

  if (sx) {
    return [archiveTextFieldSx, sx];
  }

  return archiveTextFieldSx;
}

export function ArchiveTextField({
  fullWidth = true,
  size = "small",
  sx,
  ...props
}: TextFieldProps) {
  return <TextField fullWidth={fullWidth} size={size} sx={toSxArray(sx)} {...props} />;
}
