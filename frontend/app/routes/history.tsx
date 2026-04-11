import { useTranslation } from "react-i18next";

export default function History() {
  const { t } = useTranslation();
  return (
    <div>
      <title>{`${t("nav.history")} | VIERNULVIER`}</title>

      <h1 className="text-3xl font-bold">{t("history.title")}</h1>
    </div>
  );
}
