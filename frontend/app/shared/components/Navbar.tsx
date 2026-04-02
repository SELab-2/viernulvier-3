import React, { useState } from "react";
import { NavLink } from "react-router";
import { ThemeToggle } from "~/shared/components/ThemeToggle";

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"NL" | "EN">("NL");

  const toggleLanguage = (lang: "NL" | "EN") => {
    setLanguage(lang);
  };

  return (
    <nav className="border-archive-ink/10 bg-archive-paper/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-6 md:px-24">
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
        <ul className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-archive-accent transition-colors ${
                  isActive
                    ? "border-archive-accent border-b-2"
                    : "border-b-2 border-transparent opacity-60"
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
                  isActive
                    ? "border-archive-accent border-b-2"
                    : "border-b-2 border-transparent opacity-60"
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
                  isActive
                    ? "border-archive-accent border-b-2"
                    : "border-b-2 border-transparent opacity-60"
                }`
              }
            >
              History
            </NavLink>
          </li>
        </ul>
        <div className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <div className="bg-archive-ink/5 hidden items-center rounded-full p-1 text-[10px] font-bold sm:flex">
            <button
              onClick={() => toggleLanguage("EN")}
              className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                language === "EN" ? "bg-archive-ink text-archive-paper" : "opacity-50"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => toggleLanguage("NL")}
              className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                language === "NL" ? "bg-archive-ink text-archive-paper" : "opacity-50"
              }`}
            >
              NL
            </button>
          </div>
          <ThemeToggle></ThemeToggle>
        </div>
        <button
          className="ml-auto flex cursor-pointer flex-col space-y-1 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="h-0.5 w-6 bg-current"></span>
          <span className="h-0.5 w-6 bg-current"></span>
          <span className="h-0.5 w-6 bg-current"></span>
        </button>
        {menuOpen && (
          <div className="bg-archive-paper border-archive-ink/10 absolute top-20 left-0 w-full border-t md:hidden">
            <ul className="flex flex-col items-center space-y-6 py-6 text-sm font-medium tracking-widest uppercase">
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
                  className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                    language === "EN"
                      ? "bg-archive-ink text-archive-paper"
                      : "opacity-50"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => toggleLanguage("NL")}
                  className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                    language === "NL"
                      ? "bg-archive-ink text-archive-paper"
                      : "opacity-50"
                  }`}
                >
                  NL
                </button>
              </div>

              <ThemeToggle />
            </ul>
            <div className="bg-archive-ink/10 h-px" />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
