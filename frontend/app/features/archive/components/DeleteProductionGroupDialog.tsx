import { useCallback, useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { deleteProductionGroup } from "../services/productionGroupService";
import type { ProductionGroup } from "../types/productionGroupTypes";
import { getProductionGroupId } from "../utils/productionGroupFilters";
import {
  getProductionGroupApiErrorMessage,
  ProductionGroupMutationAlert,
  productionGroupDialogActionsSx,
  productionGroupDialogBackdropSx,
  productionGroupDialogContentSx,
  productionGroupDialogDangerButtonSx,
  productionGroupDialogPaperSx,
  productionGroupDialogSecondaryButtonSx,
  productionGroupDialogTitleSx,
} from "./ProductionGroupDialog.shared";

export function DeleteProductionGroupDialog({
  productionGroup,
  onClose,
  onDeleted,
}: {
  productionGroup: ProductionGroup | null;
  onClose: () => void;
  onDeleted: (productionGroup: ProductionGroup) => void;
}) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = useCallback(() => {
    setErrorMessage(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!productionGroup) {
      resetState();
    }
  }, [productionGroup, resetState]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    resetState();
    onClose();
  }

  async function handleDelete() {
    if (!productionGroup) {
      return;
    }

    const productionGroupId = Number.parseInt(
      getProductionGroupId(productionGroup),
      10
    );

    if (Number.isNaN(productionGroupId)) {
      setErrorMessage(t("archive.productionGroups.messages.deleteFailed"));
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteProductionGroup(productionGroupId);
      onDeleted(productionGroup);
    } catch (error) {
      setErrorMessage(
        getProductionGroupApiErrorMessage(
          error,
          t("archive.productionGroups.messages.deleteFailed")
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={Boolean(productionGroup)}
      onClose={isSubmitting ? undefined : handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: productionGroupDialogPaperSx },
        backdrop: { sx: productionGroupDialogBackdropSx },
      }}
    >
      <DialogTitle sx={productionGroupDialogTitleSx}>
        {t("archive.productionGroups.deleteDialog.title")}
      </DialogTitle>
      <DialogContent sx={productionGroupDialogContentSx}>
        <p className="mb-3 text-sm leading-relaxed text-(--archive-ink) opacity-70">
          {t("archive.productionGroups.deleteDialog.description", {
            title: productionGroup?.title ?? "",
          })}
        </p>
        <p className="mb-5 text-[0.72rem] font-bold tracking-[0.18em] uppercase opacity-55">
          {t("archive.productionGroups.deleteDialog.selectedCount", {
            count: productionGroup?.production_id_urls.length ?? 0,
          })}
        </p>
        <p className="text-sm leading-relaxed text-(--archive-ink) opacity-65">
          {t("archive.productionGroups.deleteDialog.warning")}
        </p>

        <ProductionGroupMutationAlert message={errorMessage} />
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
          onClick={handleDelete}
          disabled={isSubmitting}
          sx={productionGroupDialogDangerButtonSx}
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={13} sx={{ color: "inherit", mr: 1 }} />
              {t("archive.productionGroups.actions.deleting")}
            </>
          ) : (
            t("archive.productionGroups.deleteDialog.actions.delete")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
