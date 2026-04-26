import Add from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";

export function CreateProductionButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Protected permissions={["archive:create"]}>
      <div
        className="bg-archive-accent/90 hover:bg-archive-accent flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
        onClick={onClick}
      >
        <Add /> <p>{t("archive.create_production")}</p>
      </div>
    </Protected>
  );
}
