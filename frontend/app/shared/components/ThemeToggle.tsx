import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useEffect, useState } from "react";

import { applyTheme, readInitialTheme, type Theme } from "../utils/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState(readInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme: Theme) =>
      currentTheme === "dark" ? "light" : "dark",
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-archive-ink transition-colors duration-150 hover:bg-archive-control-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-archive-accent focus-visible:outline-offset-[3px]"
    >
      {isDark ? (
        <LightModeOutlinedIcon className="h-5 w-5" fontSize="small" />
      ) : (
        <DarkModeOutlinedIcon className="h-5 w-5" fontSize="small" />
      )}
    </button>
  );
}
