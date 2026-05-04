import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// mock localStorage
const store: Record<string, string> = {};

type TranslationValue = string | { title: string; description: string }[];

type TranslationOptions = {
  returnObjects?: boolean;
  [key: string]: unknown;
};

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
      t: (key: string, options?: TranslationOptions) => {
        const map: Record<string, TranslationValue> = {
          "nav.home": "I18N_Home",
          "nav.archive": "I18N_Archive",
          "nav.history": "I18N_History",
          "nav.blogs": "I18N_Blogs",
          "nav.users": "I18N_Users",
          "auth.actions.logout": "I18N_Logout",
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
          "users.title": "I18N_Users_Title",
          "users.accessDenied.title": "I18N_Users_Access_Denied_Title",
          "users.accessDenied.description": "I18N_Users_Access_Denied_Description",
          "users.loading": "I18N_Users_Loading",
          "users.actions.add": "I18N_Users_Add",
          "users.actions.refresh": "I18N_Users_Refresh",
          "history.heroAlt": "I18N_History_Hero_Alt",
          "history.loading": "history.loading",
          "history.errorTitle": "history.errorTitle",
          "history.empty.title": "history.empty.title",
          "history.empty.description": "history.empty.description",
          "history.form.labels.year": "history.form.labels.year",
          "history.form.labels.title": "history.form.labels.title",
          "history.form.labels.content": "history.form.labels.content",
          "history.form.placeholders.year": "history.form.placeholders.year",
          "history.form.placeholders.title": "history.form.placeholders.title",
          "history.form.placeholders.content": "history.form.placeholders.content",
          "history.actions.create": "history.actions.create",
          "history.actions.edit": "history.actions.edit",
          "history.actions.delete": "history.actions.delete",
          "history.actions.cancel": "history.actions.cancel",
          "history.actions.save": "history.actions.save",
          "history.actions.saving": "history.actions.saving",
          "history.actions.submit": "history.actions.submit",
          "history.messages.createFailed": "history.messages.createFailed",
          "history.messages.updateFailed": "history.messages.updateFailed",
          "history.messages.deleteFailed": "history.messages.deleteFailed",
          "edit.cancel": "edit.cancel",
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
          "notFound.title": "I18N_NotFound_Title",
          "notFound.description": "I18N_NotFound_Description",
          "notFound.buttons.explore": "I18N_NotFound_Button_Explore",
          "notFound.buttons.history": "I18N_NotFound_Button_History",
          "productionPage.backToCollection": "I18N_Production_BackToCollection",
          "productionPage.fallback.unknownProduction":
            "I18N_Production_Fallback_UnknownProduction",
          "productionPage.fallback.archive": "I18N_Production_Fallback_Archive",
          "productionPage.fallback.defaultArtist":
            "I18N_Production_Fallback_DefaultArtist",
          "productionPage.fallback.noDescription":
            "I18N_Production_Fallback_NoDescription",
          "productionPage.fallback.noEvents": "I18N_Production_Fallback_NoEvents",
          "productionPage.fallback.noTeaser": "I18N_Production_Fallback_NoTeaser",
          "productionPage.fallback.noInfo": "I18N_Production_Fallback_NoInfo",
          "productionPage.fallback.dateUnknown": "I18N_Production_Fallback_DateUnknown",
          "productionPage.fallback.locationUnknown":
            "I18N_Production_Fallback_LocationUnknown",
          "productionPage.archiveSchema": "I18N_Production_ArchiveSchema",
          "productionPage.visualEvidence": "I18N_Production_VisualEvidence",
          "productionPage.archivePhotoAlt": "I18N_Production_ArchivePhotoAlt",
          "productionPage.dateLabel": "I18N_Production_DateLabel",
          "productionPage.placeLabel": "I18N_Production_PlaceLabel",
          "productionPage.timeLabel": "I18N_Production_TimeLabel",
          "productionPage.eventMore": "I18N_Production_EventMore",
          "productionPage.priceLabel": "I18N_Production_PriceLabel",
          "productionPage.noPrice": "I18N_Production_NoPrice",
        };

        if (options?.returnObjects) {
          return map[key];
        }

        return typeof map[key] === "string" ? map[key] : key;
      },
      i18n: {
        language: "en",
        resolvedLanguage: "en",
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
