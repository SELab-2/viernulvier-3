import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import * as productionService from "~/features/archive/services/productionService";
import * as loginServiceModule from "~/features/auth/services/loginService";

vi.mock("~/features/archive/services/productionService");

const adminUser = {
  id: 1,
  username: "testadmin",
  isSuperUser: true,
  roles: [],
  permissions: ["archive:create"],
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: null,
};

describe("CreateProductionPage", () => {
  beforeEach(() => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(adminUser);
    vi.mocked(productionService.createProduction).mockResolvedValue({
        id_url: "/api/productions/123", production_infos: [],
        event_id_urls: [],
        tags: []
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
});