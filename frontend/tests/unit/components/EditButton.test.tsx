import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ARCHIVE_PERMISSIONS } from "~/features/archive/archive.constants";

import { EditButton } from "~/features/archive/components/EditButton";
import type { Tag } from "~/features/archive/types/tagTypes";

import { AuthSessionProvider } from "~/features/auth";
import * as loginServiceModule from "~/features/auth/services/loginService";

const baseUser = {
  id: 1,
  username: "editor",
  isSuperUser: false,
  roles: ["editor"],
  permissions: ["archive:update"],
  createdAt: "2026-03-30T10:00:00",
  lastLoginAt: null,
};

const originalInfo = {
  title: "Hamlet",
  language: "nl",
};

const originalEvents = [
  {
    id: 1,
    title: "Premiere",
  },
];

const originalTags: Tag[] = [
  {
    id_url: "http://id_url/tags/1",
    names: [
      {
        language: "en",
        name: "tag_name",
      },
      {
        language: "nl",
        name: "tag_naam",
      },
    ],
  },
];

const setIsEditing = vi.fn();
const setDraftInfo = vi.fn();
const setDraftEvents = vi.fn();
const setNewEvents = vi.fn();
const setDeletedEvents = vi.fn();
const setDraftTags = vi.fn();
const setDraftAttendanceMode = vi.fn();
const setDraftPerformerType = vi.fn();
const handleSave = vi.fn();
const setNewTags = vi.fn();

function renderEditButton(overrides = {}, user = baseUser) {
  vi.spyOn(loginServiceModule, "restoreSession").mockResolvedValue(user);

  return render(
    <AuthSessionProvider>
      <EditButton
        action="Edit"
        isEditing={false}
        setIsEditing={setIsEditing}
        originalInfo={originalInfo as never}
        setDraftInfo={setDraftInfo}
        originalEvents={originalEvents as never}
        setDraftEvents={setDraftEvents}
        setNewEvents={setNewEvents}
        setDeletedEvents={setDeletedEvents}
        originalTags={originalTags}
        setDraftTags={setDraftTags}
        setNewTags={setNewTags}
        enable_save={true}
        is_saving={false}
        _handleSave={handleSave}
        setDraftAttendanceMode={setDraftAttendanceMode}
        setDraftPerformerType={setDraftPerformerType}
        originalAttendanceMode=""
        originalPerformerType=""
        {...overrides}
        permissions={[ARCHIVE_PERMISSIONS.update]}
      />
    </AuthSessionProvider>
  );
}

describe("EditButton", () => {
  it("renders edit button when not editing", async () => {
    renderEditButton();

    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls setIsEditing(true) when edit button is clicked", async () => {
    const user = userEvent.setup();

    renderEditButton();

    const button = await screen.findByRole("button", { name: "Edit" });

    await user.click(button);

    expect(setIsEditing).toHaveBeenCalledWith(true);
  });

  it("renders save and cancel buttons while editing", async () => {
    renderEditButton({ isEditing: true });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "I18N_ProductionPage_Edit_Save" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "I18N_ProductionPage_Edit_Cancel" })
      ).toBeInTheDocument();
    });
  });

  it("restores original values when cancel is clicked", async () => {
    const user = userEvent.setup();

    renderEditButton({ isEditing: true });

    const cancelButton = await screen.findByRole("button", {
      name: "I18N_ProductionPage_Edit_Cancel",
    });

    await user.click(cancelButton);

    expect(setDraftInfo).toHaveBeenCalledWith({ ...originalInfo });
    expect(setDraftEvents).toHaveBeenCalledWith([{ ...originalEvents[0] }]);
    expect(setNewEvents).toHaveBeenCalledWith([]);
    expect(setDeletedEvents).toHaveBeenCalledWith([]);
    expect(setNewTags).toHaveBeenCalledWith([]);
    expect(setIsEditing).toHaveBeenCalledWith(false);
  });

  it("calls save handler when save button is clicked", async () => {
    const user = userEvent.setup();

    renderEditButton({ isEditing: true });

    const saveButton = await screen.findByRole("button", {
      name: "I18N_ProductionPage_Edit_Save",
    });

    await user.click(saveButton);

    expect(handleSave).toHaveBeenCalled();
  });

  it("disables save button when enable_save is false", async () => {
    renderEditButton({
      isEditing: true,
      enable_save: false,
    });

    const saveButton = await screen.findByRole("button", {
      name: "I18N_ProductionPage_Edit_Save",
    });

    expect(saveButton).toBeDisabled();
  });

  it("shows spinner while saving", async () => {
    renderEditButton({
      isEditing: true,
      is_saving: true,
    });

    expect(await screen.findByTestId("spinner")).toBeInTheDocument();
  });

  it("does not render without archive:update permission", async () => {
    renderEditButton(
      {},
      {
        ...baseUser,
        permissions: [],
      }
    );

    await waitFor(() => {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
