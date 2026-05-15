import axios from "axios";
import { Alert } from "@mui/material";

export function getProductionGroupApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const detail = error.response?.data;

  if (
    detail &&
    typeof detail === "object" &&
    "detail" in detail &&
    typeof detail.detail === "string"
  ) {
    return detail.detail;
  }

  return fallbackMessage;
}

export function ProductionGroupMutationAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <Alert severity="error" variant="outlined" sx={productionGroupDialogBannerSx}>
      {message}
    </Alert>
  );
}

const productionGroupDialogBannerSx = {
  "mt": 4,
  "fontFamily": "var(--font-sans)",
  "fontSize": "0.875rem",
  "borderColor": "rgba(196, 164, 132, 0.4)",
  "color": "var(--archive-ink)",
  "& .MuiAlert-icon": { color: "var(--archive-accent)" },
};

export const productionGroupDialogSecondaryButtonSx = {
  py: 1.15,
  px: 2.35,
  borderRadius: "999px",
  textTransform: "none" as const,
  fontFamily: "var(--font-sans)",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  color: "var(--archive-ink)",
  border: "1px solid var(--archive-border)",
};

export const productionGroupDialogPrimaryButtonSx = {
  ...productionGroupDialogSecondaryButtonSx,
  "color": "#f6f0e8",
  "borderColor": "transparent",
  "backgroundColor": "var(--archive-accent)",
  "&:hover": {
    backgroundColor: "#92653e",
  },
};

export const productionGroupDialogDangerButtonSx = {
  ...productionGroupDialogSecondaryButtonSx,
  "color": "#c0392b",
  "borderColor": "rgba(192, 57, 43, 0.4)",
  "&:hover": {
    backgroundColor: "rgba(192, 57, 43, 0.08)",
  },
};

export const productionGroupDialogTitleSx = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontSize: "1.9rem",
  color: "var(--archive-ink)",
  pb: 1,
  px: 3,
  pt: 3,
};

export const productionGroupDialogContentSx = {
  pt: "0.25rem !important",
  pb: 1,
  px: 3,
  color: "var(--archive-ink)",
};

export const productionGroupDialogActionsSx = {
  px: 3,
  pt: 2,
  pb: 3,
  gap: 1.5,
  borderTop: "1px solid var(--archive-border)",
};

export const productionGroupDialogCheckboxSx = {
  "color": "rgba(196, 164, 132, 0.7)",
  "padding": 0,
  "mt": 0.25,
  "&.Mui-checked": {
    color: "var(--archive-accent)",
  },
};

export const productionGroupDialogPaperSx = {
  borderRadius: "1.75rem",
  border: "1px solid var(--archive-border)",
  backgroundColor: "var(--archive-surface-strong)",
  color: "var(--archive-ink)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.24)",
};

export const productionGroupDialogBackdropSx = {
  backgroundColor: "rgba(17, 16, 14, 0.48)",
  backdropFilter: "blur(4px)",
};
