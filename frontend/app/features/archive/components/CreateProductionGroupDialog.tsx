import { useCallback, useState, type SubmitEvent } from "react";
import {
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
import {
  getProductionGroupApiErrorMessage,
  ProductionGroupMutationAlert,
  productionGroupDialogActionsSx,
  productionGroupDialogBackdropSx,
  productionGroupDialogCheckboxSx,
  productionGroupDialogContentSx,
  productionGroupDialogPaperSx,
  productionGroupDialogPrimaryButtonSx,
  productionGroupDialogSecondaryButtonSx,
  productionGroupDialogTitleSx,
} from "./ProductionGroupDialog.shared";

function normalizeProductionGroupTitle(title: string): string {
  return title.trim().toLocaleLowerCase();
}

export function CreateProductionGroupDialog({
  open,
  selectedProductionIds,
  existingProductionGroups,
  onClose,
  onCreated,
}: {
  open: boolean;
  selectedProductionIds: string[];
  existingProductionGroups: ProductionGroup[];
  onClose: () => void;
  onCreated: (productionGroup: ProductionGroup) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [isPublicFilter, setIsPublicFilter] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* duplicate declarations removed */

  const trimmedTitle = title.trim();
  const normalizedTitle = normalizeProductionGroupTitle(title);
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

    const hasDuplicateTitle = existingProductionGroups.some(
      (productionGroup) =>
        normalizeProductionGroupTitle(productionGroup.title) === normalizedTitle
    );

    if (hasDuplicateTitle) {
      setValidationError(t("archive.productionGroups.messages.duplicateTitle"));
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
        getProductionGroupApiErrorMessage(
          error,
          t("archive.productionGroups.messages.createFailed")
        )
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
        paper: { sx: productionGroupDialogPaperSx },
        backdrop: { sx: productionGroupDialogBackdropSx },
      }}
    >
      <DialogTitle sx={productionGroupDialogTitleSx}>
        {t("archive.productionGroups.dialog.title")}
      </DialogTitle>
      <DialogContent sx={productionGroupDialogContentSx}>
        <p className="mb-3 text-sm leading-relaxed text-(--archive-ink) opacity-70">
          {t("archive.productionGroups.dialog.description")}
        </p>
        <p className="mb-5 text-[0.72rem] font-bold tracking-[0.18em] uppercase opacity-55">
          {t("archive.productionGroups.dialog.selectedCount", {
            count: selectedProductionIds.length,
          })}
        </p>

        <ProductionGroupMutationAlert message={validationError || errorMessage} />

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
                sx={productionGroupDialogCheckboxSx}
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
      <DialogActions sx={productionGroupDialogActionsSx}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
          sx={productionGroupDialogSecondaryButtonSx}
        >
          {t("archive.productionGroups.actions.cancel")}
        </Button>
        <Button
          type="submit"
          form="create-production-group-form"
          disabled={isSubmitDisabled}
          sx={productionGroupDialogPrimaryButtonSx}
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
