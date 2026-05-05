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
          "users.actions.submit": "I18N_Users_Submit",
          "users.actions.cancel": "I18N_Users_Cancel",
          "history.heroAlt": "I18N_History_Hero_Alt",
          "history.loading": "I18N_History_Loading",
          "history.errorTitle": "I18N_History_Error_Title",
          "history.empty.title": "I18N_History_Empty_Title",
          "history.empty.description": "I18N_History_Empty_Description",
          "history.form.labels.year": "I18N_History_Form_Label_Year",
          "history.form.labels.title": "I18N_History_Form_Label_Title",
          "history.form.labels.content": "I18N_History_Form_Label_Content",
          "history.form.placeholders.year": "I18N_History_Form_Placeholder_Year",
          "history.form.placeholders.title": "I18N_History_Form_Placeholder_Title",
          "history.form.placeholders.content": "I18N_History_Form_Placeholder_Content",
          "history.edit.edit": "I18N_History_Edit_Edit",
          "history.edit.save": "I18N_History_Edit_Save",
          "history.edit.cancel": "I18N_History_Edit_Cancel",
          "history.edit.saving": "I18N_History_Edit_Saving",
          "history.edit.delete": "I18N_History_Edit_Delete",
          "history.edit.create": "I18N_History_Edit_Create",
          "history.edit.submit": "I18N_History_Edit_Submit",          
          "history.messages.createFailed": "I18N_History_Message_CreateFailed",
          "history.messages.updateFailed": "I18N_History_Message_UpdateFailed",
          "history.messages.deleteFailed": "I18N_History_Message_DeleteFailed",
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
