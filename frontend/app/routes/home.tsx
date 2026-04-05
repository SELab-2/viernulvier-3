import { useTranslation } from "react-i18next";

export default function Archive() {
  const { t } = useTranslation();
  return (
    <div>
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>

      <h1 className="text-3xl font-bold">{t("nav.home")}</h1>
    </div>
  );
}
