import { useTranslation } from "react-i18next";
import NavigateButton from "~/shared/components/NavigateButton";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main>
      <title>{`Not Found | VIERNULVIER`}</title>
      <div className="mx-auto max-w-5xl py-12 text-center md:py-24">
        <h1 className="mb-6 font-serif text-5xl italic md:mb-12 md:text-8xl">
          {t("notFound.title")}
        </h1>
        <p className="mb-6 text-lg md:mb-12 md:text-2xl">{t("notFound.description")}</p>
        <div className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
          <NavigateButton location="archive" name={t("notFound.buttons.explore")} />
          <NavigateButton
            location="history"
            name={t("notFound.buttons.history")}
            variant="secondary"
          />
        </div>
      </div>
    </main>
  );
}
