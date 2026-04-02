import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div>
      <title>{`${t("nav.home")} | VIERNULVIER`}</title>

      <h1 className="text-3xl font-bold">{t("nav.home")}</h1>
    </div>
  );
}
