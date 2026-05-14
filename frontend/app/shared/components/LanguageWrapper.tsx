import { redirect, Outlet, useParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/LanguageWrapper";

const SUPPORTED_LANGS = ["en", "nl"];

export function loader({ params, request }: Route.LoaderArgs) {
  if (!SUPPORTED_LANGS.includes(params.lang ?? "")) {
    const url = new URL(request.url);
    return redirect(`/nl${url.pathname}`);
  }
  return null;
}

export default function LanguageWrapper() {
  const { lang } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  return <Outlet />;
}
