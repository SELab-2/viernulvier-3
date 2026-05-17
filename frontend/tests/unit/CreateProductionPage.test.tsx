import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import { getAllTags } from "~/features/archive/services/tagService";
import { getAllHalls } from "~/features/archive/services/hallService";
import * as productionService from "~/features/archive/services/productionService";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as eventService from "~/features/archive/services/eventService";
import type { Tag } from "~/features/archive/types/tagTypes";
import type { Hall } from "~/features/archive/types/hallTypes";

vi.mock("~/features/archive/services/productionService");
vi.mock("~/features/archive/services/eventService");
vi.mock("~/features/archive/services/tagService", () => ({
  getAllTags: vi.fn(),
}));
vi.mock("~/features/archive/services/hallService", () => ({
  getAllHalls: vi.fn(),
}));

const adminUser = {
  id: 1,
  username: "testadmin",
  isSuperUser: true,
  roles: [],
  permissions: ["archive:create"],
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: null,
};

const mockTags: Tag[] = [
  {
    id_url: "1",
    names: [
      { language: "en", name: "Classical" },
      { language: "nl", name: "Klassiek" },
    ],
  },
  {
    id_url: "2",
    names: [
      { language: "en", name: "Experimental" },
      { language: "nl", name: "Experimenteel" },
    ],
  },
];

const mockHalls: Hall[] = [
  {
    id_url: "1",
    names: [{ language: "en", name: "Hall A" }],
    address: "Street 1",
  },
  {
    id_url: "2",
    names: [{ language: "en", name: "Hall B" }],
    address: "Street 2",
  },
];

describe("CreateProductionPage", () => {
  beforeEach(() => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(adminUser);
    vi.mocked(getAllTags).mockResolvedValue(mockTags);
    vi.mocked(getAllHalls).mockResolvedValue(mockHalls);
    vi.mocked(productionService.createProduction).mockResolvedValue({
      id_url: "/api/productions/123",
      production_infos: [],
      event_id_urls: [],
      tags: [],
    });
    vi.mocked(eventService.createEvent).mockResolvedValue({
      id_url: "/api/events/1",
      production_id_url: "/api/productions/1",
      price_urls: [],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("save button is disabled when no fields are filled in", async () => {
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");
    expect(saveButton).toBeDisabled();
  });

  it("save button is enabled after filling in title", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const titleInput = await screen.findByPlaceholderText("I18_Archive_addInfo_Title");
    await user.type(titleInput, "Test productie");

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");
    expect(saveButton).not.toBeDisabled();
  });

  it("save button is enabled after adding tag", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByLabelText("Add Tag"));
    await user.click(await screen.findByText("Experimenteel"));

    expect(saveButton).not.toBeDisabled();
  });

  it("save button is enabled after adding event", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");
    expect(saveButton).toBeDisabled();

    await user.click(screen.getByText("productionPage.newEvent"));

    expect(saveButton).not.toBeDisabled();
  });

  it("filling in title and saving calls createProduction and navigates", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const titleInput = await screen.findByPlaceholderText("I18_Archive_addInfo_Title");
    await user.type(titleInput, "Test productie");

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");
    await user.click(saveButton);

    await waitFor(() => {
      expect(productionService.createProduction).toHaveBeenCalledWith(
        expect.objectContaining({
          production_info: expect.objectContaining({
            title: "Test productie",
          }),
        })
      );
    });
  });

  it("saving with selected tags sends tag ids to createProduction", async () => {
    const user = userEvent.setup();

    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const titleInput = await screen.findByPlaceholderText("I18_Archive_addInfo_Title");

    await user.type(titleInput, "Tagged production");

    await user.click(screen.getByLabelText("Add Tag"));
    await user.click(await screen.findByText("Experimenteel"));

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");

    await user.click(saveButton);

    await waitFor(() => {
      expect(productionService.createProduction).toHaveBeenCalledWith(
        expect.objectContaining({
          tag_id_urls: ["2"],
        })
      );
    });
  });

  it("saving with events creates events for the new production", async () => {
    const user = userEvent.setup();

    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const titleInput = await screen.findByPlaceholderText("I18_Archive_addInfo_Title");

    await user.type(titleInput, "Production with event");

    await user.click(screen.getByText("productionPage.newEvent"));

    const saveButton = await screen.findByText("I18N_ProductionPage_Edit_Save");

    await user.click(saveButton);

    await waitFor(() => {
      expect(eventService.createEvent).toHaveBeenCalled();
    });

    expect(eventService.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        production_id_url: "/api/productions/123",
      })
    );
  });

  it("cancel button resets form fields", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const titleInput = await screen.findByPlaceholderText("I18_Archive_addInfo_Title");
    await user.type(titleInput, "Test productie");
    expect(titleInput).toHaveValue("Test productie");

    const cancelButton = await screen.findByText("I18N_ProductionPage_Edit_Cancel");
    await user.click(cancelButton);

    expect(titleInput).toHaveValue("");
  });

  it("cancel button navigates back to archive", async () => {
    const user = userEvent.setup();
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    const cancelButton = await screen.findByText("I18N_ProductionPage_Edit_Cancel");
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("I18N_ProductionPage_Edit_Cancel")).not.toBeInTheDocument();
    });
  });

});
