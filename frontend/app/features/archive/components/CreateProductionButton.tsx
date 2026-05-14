import Add from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { useLocalizedPath } from "~/shared/hooks/useLocalizedPath";

export function CreateProductionButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLocalizedPath();
  const openCreateProductionPage = () => {
    navigate(lp("archive/productions/create"));
  };
  return (
    <Protected permissions={[ARCHIVE_PERMISSIONS.create]}>
      <button
        type="button"
        className="bg-archive-accent/90 hover:bg-archive-accent text-archive-paper inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-sm font-medium tracking-[0.02em] transition-colors"
        onClick={openCreateProductionPage}
      >
        <Add sx={{ fontSize: 18 }} />
        <span>{t("archive.create_production")}</span>
      </button>
    </Protected>
  );
}
