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

const translationMap: Record<string, TranslationValue> = {
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
  "archive.create_production": "I18N_Archive_Create_Production",
  "archive.productionGroups.actions.create":
    "I18N_Archive_ProductionGroups_Actions_Create",
  "archive.productionGroups.actions.creating":
    "I18N_Archive_ProductionGroups_Actions_Creating",
  "archive.productionGroups.actions.delete":
    "I18N_Archive_ProductionGroups_Actions_Delete_Production_Group",
  "archive.productionGroups.actions.deleting":
    "I18N_Archive_ProductionGroups_Actions_Deleting",
  "archive.productionGroups.deleteInfo.ariaLabel":
    "I18N_Archive_ProductionGroups_DeleteInfo_AriaLabel",
  "archive.productionGroups.deleteInfo.tooltip":
    "I18N_Archive_ProductionGroups_DeleteInfo_Tooltip",
  "archive.productionGroups.actions.cancel":
    "I18N_Archive_ProductionGroups_Actions_Cancel",
  "archive.productionGroups.dialog.title": "I18N_Archive_ProductionGroups_Dialog_Title",
  "archive.productionGroups.dialog.description":
    "I18N_Archive_ProductionGroups_Dialog_Description",
  "archive.productionGroups.dialog.selectedCount":
    "I18N_Archive_ProductionGroups_Dialog_SelectedCount_{{count}}",
  "archive.productionGroups.dialog.nameLabel":
    "I18N_Archive_ProductionGroups_Dialog_NameLabel",
  "archive.productionGroups.dialog.publicLabel":
    "I18N_Archive_ProductionGroups_Dialog_PublicLabel",
  "archive.productionGroups.dialog.publicHint":
    "I18N_Archive_ProductionGroups_Dialog_PublicHint",
  "archive.productionGroups.deleteDialog.title":
    "I18N_Archive_ProductionGroups_DeleteDialog_Title",
  "archive.productionGroups.deleteDialog.description":
    "I18N_Archive_ProductionGroups_DeleteDialog_Description",
  "archive.productionGroups.deleteDialog.selectedCount":
    "I18N_Archive_ProductionGroups_DeleteDialog_SelectedCount_{{count}}",
  "archive.productionGroups.deleteDialog.warning":
    "I18N_Archive_ProductionGroups_DeleteDialog_Warning",
  "archive.productionGroups.deleteDialog.actions.delete":
    "I18N_Archive_ProductionGroups_DeleteDialog_Actions_Delete",
  "archive.productionGroups.messages.titleRequired":
    "I18N_Archive_ProductionGroups_Messages_TitleRequired",
  "archive.productionGroups.messages.noProductionsSelected":
    "I18N_Archive_ProductionGroups_Messages_NoProductionsSelected",
  "archive.productionGroups.messages.createFailed":
    "I18N_Archive_ProductionGroups_Messages_CreateFailed",
  "archive.productionGroups.messages.deleteFailed":
    "I18N_Archive_ProductionGroups_Messages_DeleteFailed",
  "archive.accessDenied.title": "I18N_Archive_Access_Denied_Title",
  "archive.accessDenied.description": "I18N_Archive_Access_Denied_Description",
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
  "blogs.title": "I18N_Blogs_Title",
  "blogs.searchPlaceholder": "I18N_Blogs_Search_Placeholder",
  "blogs.showMore": "I18N_Blogs_Show_More",
  "blogs.noResults.header": "I18N_Blogs_No_Results_Header",
  "blogs.noResults.subtext": "I18N_Blogs_No_Results_Subtext",
  "blogs.card.other_prods": "I18N_Blog_Many_Productions",
  "blogs.card.no_prods": "I18N_Blog_No_Productions",
  "blogs.card.details": "I18N_Blog_Details",
  "blogs.contentPage.backToBlogs": "I18N_Back_To_Blogs",
  "blogs.contentPage.linkedProductions": "I18N_Blog_Productions",
  "blogs.contentPage.fallback": "I18N_Blog_Fallback",
  "blogs.contentPage.media": "I18N_Blog_Media",
  "notFound.title": "I18N_NotFound_Title",
  "notFound.description": "I18N_NotFound_Description",
  "notFound.buttons.explore": "I18N_NotFound_Button_Explore",
  "notFound.buttons.history": "I18N_NotFound_Button_History",
  "notFound.quote": "I18N_NotFound_Quote",
  "editfield.modified": "I18N_Modified",
  "productionPage.backToCollection": "I18N_Production_BackToCollection",
  "productionPage.fallback.unknownProduction":
    "I18N_Production_Fallback_UnknownProduction",
  "productionPage.fallback.archive": "I18N_Production_Fallback_Archive",
  "productionPage.fallback.defaultArtist": "I18N_Production_Fallback_DefaultArtist",
  "productionPage.fallback.noDescription": "I18N_Production_Fallback_NoDescription",
  "productionPage.fallback.noEvents": "I18N_Production_Fallback_NoEvents",
  "productionPage.fallback.noTeaser": "I18N_Production_Fallback_NoTeaser",
  "productionPage.fallback.noInfo": "I18N_Production_Fallback_NoInfo",
  "productionPage.fallback.dateUnknown": "I18N_Production_Fallback_DateUnknown",
  "productionPage.fallback.locationUnknown": "I18N_Production_Fallback_LocationUnknown",
  "productionPage.archiveSchema": "I18N_Production_ArchiveSchema",
  "productionPage.visualEvidence": "I18N_Production_VisualEvidence",
  "productionPage.archivePhotoAlt": "I18N_Production_ArchivePhotoAlt",
  "productionPage.dateLabel": "I18N_Production_DateLabel",
  "productionPage.placeLabel": "I18N_Production_PlaceLabel",
  "productionPage.timeLabel": "I18N_Production_TimeLabel",
  "productionPage.eventMore": "I18N_Production_EventMore",
  "productionPage.priceLabel": "I18N_Production_PriceLabel",
  "productionPage.noPrice": "I18N_Production_NoPrice",
  "productionPage.infoNotAvailable": "I18N_ProductionInfo_NotAvailable",
  "productionPage.add.add": "I18N_ProductionInfo_Add",
  "productionPage.delete.delete": "I18N_ProductionInfo_Delete",
  "productionPage.edit.title": "I18N_ProductionInfo_Edit_Title",
  "productionPage.edit.teaser": "I18N_ProductionInfo_Edit_Teaser",
  "productionPage.edit.description": "I18N_ProductionInfo_Edit_Description",
};

const mockTranslate = (key: string, options?: TranslationOptions) => {
  if (options?.returnObjects) {
    return translationMap[key];
  }

  return typeof translationMap[key] === "string" ? translationMap[key] : key;
};

const mockI18n = {
  language: "en",
  resolvedLanguage: "en",
  changeLanguage: vi.fn(),
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
      t: mockTranslate,
      i18n: mockI18n,
    }),
  };
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
