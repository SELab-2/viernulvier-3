import { useCallback, useEffect, useState, type SubmitEvent } from "react";
import axios from "axios";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { ArchiveTextField } from "~/shared/components/ArchiveTextField";

import { createProductionGroup } from "../services/productionGroupService";
import type { ProductionGroup } from "../types/productionGroupTypes";

function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
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

function MutationAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <Alert severity="error" variant="outlined" sx={bannerSx}>
      {message}
    </Alert>
  );
}

export function CreateProductionGroupDialog({
  open,
  selectedProductionIds,
  onClose,
  onCreated,
}: {
  open: boolean;
  selectedProductionIds: string[];
  onClose: () => void;
  onCreated: (productionGroup: ProductionGroup) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [isPublicFilter, setIsPublicFilter] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedTitle = title.trim();
  const isSubmitDisabled =
    isSubmitting || !trimmedTitle || selectedProductionIds.length === 0;

  const clearMessages = useCallback(() => {
    setValidationError(null);
    setErrorMessage(null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setIsPublicFilter(true);
    clearMessages();
    setIsSubmitting(false);
  }, [clearMessages]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedProductionIds.length === 0) {
      setValidationError(t("archive.productionGroups.messages.noProductionsSelected"));
      return;
    }

    if (!trimmedTitle) {
      setValidationError(t("archive.productionGroups.messages.titleRequired"));
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      const productionGroup = await createProductionGroup({
        title: trimmedTitle,
        is_public_filter: isPublicFilter,
        production_id_urls: Array.from(new Set(selectedProductionIds)),
      });

      onCreated(productionGroup);
      resetForm();
      onClose();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, t("archive.productionGroups.messages.createFailed"))
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: dialogPaperSx },
        backdrop: { sx: dialogBackdropSx },
      }}
    >
      <DialogTitle sx={dialogTitleSx}>
        {t("archive.productionGroups.dialog.title")}
      </DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <p className="mb-3 text-sm leading-relaxed text-(--archive-ink) opacity-70">
          {t("archive.productionGroups.dialog.description")}
        </p>
        <p className="mb-5 text-[0.72rem] font-bold tracking-[0.18em] uppercase opacity-55">
          {t("archive.productionGroups.dialog.selectedCount", {
            count: selectedProductionIds.length,
          })}
        </p>

        <MutationAlert message={validationError || errorMessage} />

        <form
          id="create-production-group-form"
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-5"
        >
          <ArchiveTextField
            label={t("archive.productionGroups.dialog.nameLabel")}
            name="production-group-title"
            autoFocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (validationError || errorMessage) {
                clearMessages();
              }
            }}
          />

          <div className="border-archive-border bg-archive-surface rounded-2xl border p-4">
            <label className="flex cursor-pointer items-start gap-3 rounded-[0.875rem] transition-colors hover:bg-[rgba(196,164,132,0.08)]">
              <Checkbox
                checked={isPublicFilter}
                onChange={(event) => setIsPublicFilter(event.target.checked)}
                sx={checkboxSx}
              />
              <span className="space-y-1 pt-0.5">
                <span className="block text-sm font-medium text-(--archive-ink)">
                  {t("archive.productionGroups.dialog.publicLabel")}
                </span>
                <span className="block text-sm leading-relaxed opacity-65">
                  {t("archive.productionGroups.dialog.publicHint")}
                </span>
              </span>
            </label>
          </div>
        </form>
      </DialogContent>
      <DialogActions sx={dialogActionsSx}>
        <Button onClick={handleClose} disabled={isSubmitting} sx={secondaryButtonSx}>
          {t("archive.productionGroups.actions.cancel")}
        </Button>
        <Button
          type="submit"
          form="create-production-group-form"
          disabled={isSubmitDisabled}
          sx={primaryButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("archive.productionGroups.actions.creating")}
            </>
          ) : (
            t("archive.productionGroups.actions.create")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const bannerSx = {
  "mt": 4,
  "fontFamily": "var(--font-sans)",
  "fontSize": "0.875rem",
  "borderColor": "rgba(196, 164, 132, 0.4)",
  "color": "var(--archive-ink)",
  "& .MuiAlert-icon": { color: "var(--archive-accent)" },
};

const secondaryButtonSx = {
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

const primaryButtonSx = {
  ...secondaryButtonSx,
  "color": "#f6f0e8",
  "borderColor": "transparent",
  "backgroundColor": "var(--archive-accent)",
  "&:hover": {
    backgroundColor: "#92653e",
  },
};

const dialogTitleSx = {
  fontFamily: "var(--font-serif)",
  fontStyle: "italic",
  fontSize: "1.9rem",
  color: "var(--archive-ink)",
  pb: 1,
  px: 3,
  pt: 3,
};

const dialogContentSx = {
  pt: "0.25rem !important",
  pb: 1,
  px: 3,
  color: "var(--archive-ink)",
};

const dialogActionsSx = {
  px: 3,
  pt: 2,
  pb: 3,
  gap: 1.5,
  borderTop: "1px solid var(--archive-border)",
};

const checkboxSx = {
  "color": "rgba(196, 164, 132, 0.7)",
  "padding": 0,
  "mt": 0.25,
  "&.Mui-checked": {
    color: "var(--archive-accent)",
  },
};

const dialogPaperSx = {
  borderRadius: "1.75rem",
  border: "1px solid var(--archive-border)",
  backgroundColor: "var(--archive-surface-strong)",
  color: "var(--archive-ink)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 28px 90px rgba(0, 0, 0, 0.24)",
};

const dialogBackdropSx = {
  backgroundColor: "rgba(17, 16, 14, 0.48)",
  backdropFilter: "blur(4px)",
};
