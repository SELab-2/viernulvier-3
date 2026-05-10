import Add from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";

export function CreateProductionButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Protected permissions={["archive:create"]}>
      <button
        type="button"
        className="bg-archive-accent/90 hover:bg-archive-accent text-archive-paper inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-sm font-medium tracking-[0.02em] transition-colors"
        onClick={onClick}
      >
        <Add sx={{ fontSize: 18 }} />
        <span>{t("archive.create_production")}</span>
      </button>
    </Protected>
  );
}
