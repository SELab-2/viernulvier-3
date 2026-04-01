import { useParams, useNavigate, useLocation } from "react-router";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "nl", label: "NL" },
];

export default function LanguageSwitcher() {
  const { lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "nl" : "en";
    const newPath = location.pathname.replace(`/${lang}`, `/${newLang}`);
    navigate(newPath);
  };

  return (
    <div
      onClick={toggleLanguage}
      className="bg-archive-ink/5 bg-archive-ink-dark/5 hidden cursor-pointer items-center rounded-full p-1 text-[10px] font-bold sm:flex"
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          className={`cursor-pointer px-3 py-1 ${
            code === lang
              ? "bg-archive-ink bg-archive-ink-dark text-archive-paper text-archive-paper-dark rounded-full"
              : "opacity-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
