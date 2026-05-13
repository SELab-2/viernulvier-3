import { useTranslation } from "react-i18next";
import { Protected } from "~/features/auth";
import { ARCHIVE_PERMISSIONS } from "../archive.constants";
import { updateProductionByUrl } from "../services/productionService";

async function handleInfoDelete(
  production_id_url: string,
  language: string,
  confirmeMessage: string,
  errorMessage: string
) {
  const confirmed = window.confirm(confirmeMessage);
  if (!confirmed) return;
  try {
    await updateProductionByUrl(production_id_url, {
      remove_languages: [language],
    });
    window.location.reload();
  } catch {
    window.alert(errorMessage);
  }
}

type DeleteInfoButtonProps = {
  production_id_url: string;
  language: string;
};

export function DeleteInfoButton({
  production_id_url,
  language,
}: DeleteInfoButtonProps) {
  const { t } = useTranslation();
  const shared_css = `
    shadow-lg
    hover:bg-archive-control-hover
    rounded-full
    cursor-pointer
    transition-colors
    duration-150
    text-archive-ink
    inline-flex
    px-6 py-3
    font-semibold text-white
    `;
  return (
    <Protected permissions={[ARCHIVE_PERMISSIONS.update]}>
      <button
        id="delete-production-button"
        onClick={() =>
          handleInfoDelete(
            production_id_url,
            language,
            t("productionPage.delete.confirm"),
            t("productionPage.delete.error")
          )
        }
        className={`${shared_css} bg-archive-accent`}
      >
        {t("productionPage.delete.delete")}
      </button>
    </Protected>
  );
}
