import React, { useState } from "react";
import { NavLink } from "react-router";
import { ThemeToggle } from  "~/shared/components/ThemeToggle"


const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<"home" | "archive" | "history">("home");
  const [language, setLanguage] = useState<"NL" | "EN">("NL");

  const showPage = (page: "home" | "archive" | "history") => {
    setActivePage(page);
  };

  const toggleLanguage = (lang: "NL" | "EN") => {
    setLanguage(lang);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-archive-ink/10 bg-archive-paper/80 backdrop-blur-md">
      <div className="max-w-[1800px] mx-auto px-6 md:px-24 h-20 flex items-center justify-between">
        <header className="sticky top-0 z-50">
          <div className="group flex items-center space-x-2">
            <img
                src="/logo.svg"
                alt=""
                className="h-8 w-auto md:h-10"
                style={{ filter: "var(--archive-logo-filter)" }}
            />
            <span
                aria-hidden="true"
                className="font-serif text-base italic opacity-50 md:text-[1.125rem]"
            >
              Archief
            </span>
          </div>
        </header>
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
            <div className="hidden sm:flex items-center bg-archive-ink/5 rounded-full p-1 text-[10px] font-bold">
              <button
                onClick={() => toggleLanguage("EN")}
                className={`px-3 py-1 cursor-pointer rounded-full transition-colors ${
                  language === "EN" ? "bg-archive-ink text-archive-paper" : "opacity-50"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => toggleLanguage("NL")}
                className={`px-3 py-1 cursor-pointer rounded-full transition-colors ${
                  language === "NL" ? "bg-archive-ink text-archive-paper" : "opacity-50"
                }`}
              >
                NL
              </button>
          </div>
          <ThemeToggle></ThemeToggle>
        </div>
        <button className="md:hidden flex flex-col space-y-1 md:hidden ml-auto cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="w-6 h-0.5 bg-current"></span>
              <span className="w-6 h-0.5 bg-current"></span>
              <span className="w-6 h-0.5 bg-current"></span>
        </button>
        {menuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-archive-paper border-t border-archive-ink/10">
            <ul className="flex flex-col items-center space-y-6 py-6 text-sm font-medium uppercase tracking-widest">
              <li>
                <NavLink to="/" onClick={() => setMenuOpen(false)}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/archive" onClick={() => setMenuOpen(false)}>
                  Archief
                </NavLink>
              </li>
              <li>
                <NavLink to="/history" onClick={() => setMenuOpen(false)}>
                  History
                </NavLink>
              </li>

              <div className="flex space-x-2">
                <button
                  onClick={() => toggleLanguage("EN")}
                  className={`px-3 py-1 cursor-pointer rounded-full transition-colors ${
                    language === "EN" ? "bg-archive-ink text-archive-paper" : "opacity-50"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => toggleLanguage("NL")}
                  className={`px-3 py-1 cursor-pointer rounded-full transition-colors ${
                    language === "NL" ? "bg-archive-ink text-archive-paper" : "opacity-50"
                  }`}
                >
                  NL
                </button>
              </div>

              <ThemeToggle />
            </ul>
            <div className="h-px bg-archive-ink/10" />
          </div>
        )}
      </div>  
    </nav>
  );
};

export default Navbar;