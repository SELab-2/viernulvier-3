import { useParams, useNavigate, useLocation } from "react-router";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
];

export default function LanguageSwitcher() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const switchLanguage = (newLang: string) => {
    const newPath = location.pathname.replace(`/${lang}`, `/${newLang}`);
    navigate(newPath);
  };

  return (
    <div className="bg-archive-ink/5 dark:bg-archive-ink-dark/5 hidden items-center rounded-full p-1 text-[10px] font-bold sm:flex">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLanguage(code)}
          disabled={code === lang}
          className={`px-3 py-1 ${
            code === lang
              ? "bg-archive-ink dark:bg-archive-ink-dark text-archive-paper dark:text-archive-paper-dark rounded-full"
              : "opacity-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
