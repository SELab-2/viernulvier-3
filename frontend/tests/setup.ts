import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// mock localStorage
const store: Record<string, string> = {};

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
});

// Partial mock of UseTranslation (for easy testing)
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const map: Record<string, string> = {
          "nav.home": "I18N_Home",
          "nav.archive": "I18N_Archive",
          "nav.history": "I18N_History",
          "home.title": "I18N_Title",
          "home.description": "I18N_Description",
          "home.stats.productions": "I18N_Home_Stats_Productions",
          "home.stats.events": "I18N_Home_Stats_Events",
          "home.stats.artists": "I18N_Home_Stats_Artists",
          "home.stats.genres": "I18N_Home_Stats_Genres",
          "home.buttons.explore": "I18N_Home_Button_Explore",
          "home.buttons.history": "I18N_Home_Button_History",
          "archive.title": "I18N_Archive_Title",
          "history.title": "I18N_History_Title",
          "footer.website": "I18N_Footer_Website",
        };

        return map[key] || key;
      },
    }),
  };
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
