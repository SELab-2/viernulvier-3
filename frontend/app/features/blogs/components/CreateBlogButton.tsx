import Add from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";

export function CreateBlogButton({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <Protected permissions={["blog:create"]}>
      <div
        className="bg-archive-accent/90 hover:bg-archive-accent flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
        onClick={onClick}
      >
        <Add /> <p>{t("blogs.create_blog")}</p>
      </div>
    </Protected>
  );
}
