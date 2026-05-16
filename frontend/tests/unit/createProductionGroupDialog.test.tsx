import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/features/archive/services/productionGroupService", () => ({
  createProductionGroup: vi.fn(),
}));

import { CreateProductionGroupDialog } from "~/features/archive/components/CreateProductionGroupDialog";
import * as productionGroupServiceModule from "~/features/archive/services/productionGroupService";

describe("CreateProductionGroupDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a production group from the selected productions", async () => {
    const createdGroup = {
      id_url: "/api/v1/archive/production-groups/12",
      title: "Autumn series",
      is_public_filter: true,
      production_id_urls: [
        "/api/v1/archive/productions/1",
        "/api/v1/archive/productions/2",
      ],
    };

    vi.mocked(productionGroupServiceModule.createProductionGroup).mockResolvedValue(
      createdGroup
    );

    const onClose = vi.fn();
    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateProductionGroupDialog
        open
        selectedProductionIds={createdGroup.production_id_urls}
        existingProductionGroups={[]}
        onClose={onClose}
        onCreated={onCreated}
      />
    );

    await user.type(
      screen.getByLabelText("I18N_Archive_ProductionGroups_Dialog_NameLabel"),
      "  Autumn series  "
    );
    await user.click(
      screen.getByRole("button", {
        name: "I18N_Archive_ProductionGroups_Actions_Create",
      })
    );

    await waitFor(() => {
      expect(productionGroupServiceModule.createProductionGroup).toHaveBeenCalledWith({
        title: "Autumn series",
        is_public_filter: true,
        production_id_urls: createdGroup.production_id_urls,
      });
    });

    expect(onCreated).toHaveBeenCalledWith(createdGroup);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a validation error when the title already exists", async () => {
    const user = userEvent.setup();

    render(
      <CreateProductionGroupDialog
        open
        selectedProductionIds={["/api/v1/archive/productions/1"]}
        existingProductionGroups={[
          {
            id_url: "/api/v1/archive/production-groups/12",
            title: "Autumn series",
            is_public_filter: true,
            production_id_urls: ["/api/v1/archive/productions/1"],
          },
        ]}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText("I18N_Archive_ProductionGroups_Dialog_NameLabel"),
      "  autumn series  "
    );
    await user.click(
      screen.getByRole("button", {
        name: "I18N_Archive_ProductionGroups_Actions_Create",
      })
    );

    expect(productionGroupServiceModule.createProductionGroup).not.toHaveBeenCalled();
    expect(
      await screen.findByText("I18N_Archive_ProductionGroups_Messages_DuplicateTitle")
    ).toBeInTheDocument();
  });

  it("shows the backend error message when creation fails", async () => {
    vi.mocked(productionGroupServiceModule.createProductionGroup).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          detail: "A series with this title already exists.",
        },
      },
    });

    const user = userEvent.setup();

    render(
      <CreateProductionGroupDialog
        open
        selectedProductionIds={["/api/v1/archive/productions/1"]}
        existingProductionGroups={[]}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />
    );

    await user.type(
      screen.getByLabelText("I18N_Archive_ProductionGroups_Dialog_NameLabel"),
      "Autumn series"
    );
    await user.click(
      screen.getByRole("button", {
        name: "I18N_Archive_ProductionGroups_Actions_Create",
      })
    );

    expect(
      await screen.findByText("A series with this title already exists.")
    ).toBeInTheDocument();
  });
});
