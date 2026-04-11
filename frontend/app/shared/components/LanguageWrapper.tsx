import { useEffect } from "react";
import { useParams, Navigate, Outlet } from "react-router";
import { useTranslation } from "react-i18next";

const SUPPORTED_LANGS = ["en", "nl"];

export default function LanguageWrapper() {
  const { lang } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  if (!lang || !SUPPORTED_LANGS.includes(lang)) {
    return <Navigate to="/en" replace />;
  }

  return <Outlet />;
}
