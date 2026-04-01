import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useTheme } from "~/shared/components/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="text-archive-ink hover:bg-archive-control-hover focus-visible:outline-archive-accent inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] cursor-pointer"
    >
      {isDark ? (
        <LightModeOutlinedIcon className="h-5 w-5" fontSize="small" />
      ) : (
        <DarkModeOutlinedIcon className="h-5 w-5" fontSize="small" />
      )}
    </button>
  );
}
