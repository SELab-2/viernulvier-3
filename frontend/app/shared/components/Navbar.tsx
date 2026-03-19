import React, { useState } from "react";
import { NavLink } from "react-router";
import ToggleButton from  "~/shared/components/ToggleButton"


const Navbar: React.FC = () => {
  const [activePage, setActivePage] = useState<"home" | "archive" | "history">("home");
  const [language, setLanguage] = useState<"NL" | "EN">("NL");

  const showPage = (page: "home" | "archive" | "history") => {
    setActivePage(page);
  };

  const toggleLanguage = (lang: "NL" | "EN") => {
    setLanguage(lang);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-archive-ink/10 dark:border-archive-ink-dark/10 bg-archive-paper/80 dark:bg-archive-paper-dark/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-[1800px] mx-auto px-6 md:px-24 h-20 flex items-center justify-between">
        <div className="group flex items-center space-x-2">
          <div id="logo-official" className="flex items-center">
            <span className="font-sans text-xl md:text-2xl tracking-tight">vierNulvier</span>
          </div>
          <span className="font-serif text-lg md:text-xl font-light tracking-tight opacity-50 italic">
            Archief
          </span>
        </div>

        <ul className="hidden md:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-archive-accent transition-colors ${
                  isActive ? "border-b-2 border-archive-accent" : "border-b-2 border-transparent opacity-60"
                }`
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/archive"
              className={({ isActive }) =>
                `hover:text-archive-accent transition-colors ${
                  isActive ? "border-b-2 border-archive-accent" : "border-b-2 border-transparent opacity-60"
                }`
              }
            >
              Archief
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `hover:text-archive-accent transition-colors ${
                  isActive ? "border-b-2 border-archive-accent" : "border-b-2 border-transparent opacity-60"
                }`
              }
            >
              History
            </NavLink>
          </li>
        </ul>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest">
            <div className="hidden sm:flex items-center bg-archive-ink/5 dark:bg-archive-ink-dark/5 rounded-full p-1 text-[10px] font-bold">
              <button
                onClick={() => toggleLanguage("EN")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  language === "EN" ? "bg-archive-ink dark:bg-archive-ink-dark text-archive-paper dark:text-archive-paper-dark" : "opacity-50"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => toggleLanguage("NL")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  language === "NL" ? "bg-archive-ink dark:bg-archive-ink-dark text-archive-paper dark:text-archive-paper-dark" : "opacity-50"
                }`}
              >
                NL
              </button>
          </div>
          <ToggleButton></ToggleButton>
        </div>
      </div>  
    </nav>
  );
};

export default Navbar;