import React, { useState } from "react";
import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { ThemeToggle } from "~/shared/components/ThemeToggle";
import { useLocalizedPath } from "../hooks/useLocalizedPath";

const Navbar: React.FC = () => {
  // Mobile dropdown state
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `hover:text-archive-accent transition-colors ${
      isActive
        ? "border-archive-accent border-b-2"
        : "border-b-2 border-transparent opacity-60"
    }`;

  // "/archive" -> "/[en|nl]/archive"
  const lp = useLocalizedPath();

  // i18n
  const { t } = useTranslation();

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
              {`${t("nav.archive")}`}
            </span>
          </div>
        </header>
        <ul className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <li>
            <NavLink to={lp("/")} className={navLinkClass} end>
              {`${t("nav.home")}`}
            </NavLink>
          </li>
          <li>
            <NavLink to={lp("/archive")} className={navLinkClass}>
              {`${t("nav.archive")}`}
            </NavLink>
          </li>
          <li>
            <NavLink to={lp("/history")} className={navLinkClass}>
              {`${t("nav.history")}`}
            </NavLink>
          </li>
        </ul>
        <div className="hidden items-center space-x-8 text-sm font-medium tracking-widest uppercase md:flex">
          <LanguageSwitcher />
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
                <NavLink to={lp("/")} onClick={() => setMenuOpen(false)}>
                  {`${t("nav.home")}`}
                </NavLink>
              </li>
              <li>
                <NavLink to={lp("/archive")} onClick={() => setMenuOpen(false)}>
                  {`${t("nav.archive")}`}
                </NavLink>
              </li>
              <li>
                <NavLink to={lp("/history")} onClick={() => setMenuOpen(false)}>
                  {`${t("nav.history")}`}
                </NavLink>
              </li>

              <LanguageSwitcher />
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
