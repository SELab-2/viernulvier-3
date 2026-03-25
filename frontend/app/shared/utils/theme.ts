export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

function readCookieTheme() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${THEME_STORAGE_KEY}=`));
  const theme = cookie?.split("=")[1];

  return theme === "light" || theme === "dark" ? theme : null;
}

export function readInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    // Ignore storage access failures.
  }

  const cookieTheme = readCookieTheme();
  if (cookieTheme) {
    return cookieTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage access failures.
  }

  document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function getThemeBootstrapScript() {
  return `
(() => {
  try {
    const storedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    const cookieTheme = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('${THEME_STORAGE_KEY}='))
      ?.split('=')[1];

    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : cookieTheme === 'light' || cookieTheme === 'dark'
        ? cookieTheme
        : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch {
  }
})();
`;
}
