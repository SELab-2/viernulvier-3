import { useTranslation } from "react-i18next";

export default function Archive() {
  const { t } = useTranslation();
  return (
    <div>
      <title>{`${t("nav.archive")} | VIERNULVIER`}</title>

      <h1 className="text-3xl font-bold">{t("archive.title")}</h1>
    </div>
  );
}
