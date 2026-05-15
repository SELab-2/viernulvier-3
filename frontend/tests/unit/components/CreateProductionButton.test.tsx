import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithRouterAndTheme } from "tests/utils/renderWithRouterAndTheme";
import userEvent from "@testing-library/user-event";
import * as artistService from "~/features/archive/services/artistService";
import * as productionService from "~/features/archive/services/productionService";
import * as productionGroupService from "~/features/archive/services/productionGroupService";
import * as tagService from "~/features/archive/services/tagService";
import * as loginServiceModule from "~/features/auth/services/loginService";
import * as productionGroupService from "~/features/archive/services/productionGroupService";

vi.mock("~/features/archive/services/productionService");
vi.mock("~/features/archive/services/productionGroupService");
vi.mock("~/features/archive/services/artistService");
vi.mock("~/features/archive/services/tagService");
vi.mock("~/features/archive/services/productionGroupService");

const adminUser = {
  id: 1,
  username: "testadmin",
  isSuperUser: true,
  roles: [],
  permissions: ["archive:create"],
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: null,
};

const studentUser = {
  id: 2,
  username: "student",
  isSuperUser: false,
  roles: [],
  permissions: ["archive:update"],
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: null,
};

async function renderArchiveAndNavigate() {
  renderWithRouterAndTheme({ useRealArchive: true });
  const user = userEvent.setup();
  const links = screen.getAllByRole("link", { name: "I18N_Archive" });
  await user.click(links[0]);
}

describe("CreateProductionButton", () => {
  beforeEach(() => {
    vi.mocked(artistService.getArtists).mockResolvedValue([]);
    vi.mocked(tagService.getAllTags).mockResolvedValue([]);
    vi.mocked(productionGroupService.getAllProductionGroups).mockResolvedValue([]);
    vi.mocked(productionGroupService.getAllProductionGroups).mockResolvedValue([]);
    vi.mocked(productionService.getProductionsPaginated).mockResolvedValue({
      productions: [],
      pagination: { has_more: false, total_count: 0 },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("create button is visible with rights", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(adminUser);
    await renderArchiveAndNavigate();

    expect(screen.queryByText("I18N_Archive_Create_Production")).toBeInTheDocument();
  });

  it("create button is not visible without rights", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(studentUser);
    await renderArchiveAndNavigate();

    expect(
      screen.queryByText("I18N_Archive_Create_Production")
    ).not.toBeInTheDocument();
  });

  it("navigating with rights shows CreateProductionPage", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(adminUser);

    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    expect(
      await screen.findByText("I18N_ProductionInfo_Edit_Title")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("I18N_ProductionInfo_Edit_Teaser")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("I18N_ProductionInfo_Edit_Description")
    ).toBeInTheDocument();
  });

  it("navigating without rights shows access denied", async () => {
    vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(studentUser);
    renderWithRouterAndTheme({
      useRealCreateProductionPage: true,
      initialPath: "/archive/productions/create",
    });

    expect(
      await screen.findByText("I18N_Archive_Access_Denied_Title")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("I18N_Archive_Access_Denied_Description")
    ).toBeInTheDocument();
  });
});
