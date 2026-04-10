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
      t: (key: string, options?: any) => {
        const map: Record<string, any> = {
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
          "history.heroAlt": "I18N_History_Hero_Alt",
          "history.entries": [
            {
              title: "I18N_History_Entry1_Title",
              description: "I18N_History_Entry1_Description",
            },
            {
              title: "I18N_History_Entry2_Title",
              description: "I18N_History_Entry2_Description",
            },
            {
              title: "I18N_History_Entry3_Title",
              description: "I18N_History_Entry3_Description",
            },
            {
              title: "I18N_History_Entry4_Title",
              description: "I18N_History_Entry4_Description",
            },
            {
              title: "I18N_History_Entry5_Title",
              description: "I18N_History_Entry5_Description",
            },
            {
              title: "I18N_History_Entry6_Title",
              description: "I18N_History_Entry6_Description",
            },
            {
              title: "I18N_History_Entry7_Title",
              description: "I18N_History_Entry7_Description",
            },
            {
              title: "I18N_History_Entry8_Title",
              description: "I18N_History_Entry8_Description",
            },
          ],
        };

        if (options?.returnObjects) {
          return map[key];
        }

        return typeof map[key] === "string" ? map[key] : key;
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
