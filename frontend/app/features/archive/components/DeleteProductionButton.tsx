import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { Protected } from "~/features/auth";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { deleteProduction } from "../services/productionService";

type DeleteProductionButtonProps = {
  productionId: number;
};

export function DeleteProductionButton({ productionId }: DeleteProductionButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(t("productionPage.deleteProduction.confirm"));
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteProduction(productionId);
      navigate(lp("/archive"));
    } catch {
      window.alert(t("productionPage.deleteProduction.error"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Protected permissions={[ARCHIVE_PERMISSIONS.delete]}>
      <button
        id="delete-production-button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex cursor-pointer rounded-full border border-red-700/30 bg-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-900/20 transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting
          ? t("productionPage.deleteProduction.deleting")
          : t("productionPage.deleteProduction.delete")}
      </button>
    </Protected>
  );
}
