import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ComplexEditableField from "~/shared/components/ComplexEditableField";
import userEvent from "@testing-library/user-event";
import { deltaToHtml, htmlToDelta } from "~/archive-rich-text.client";
import type { Delta } from "quill";

// Mocks
vi.mock("~/archive-rich-text.client", () => ({
  htmlToDelta: vi.fn(),
  deltaToHtml: vi.fn(),
}));
vi.mock("~/shared/components/ArchiveRichTextField", () => ({
  ArchiveRichTextField: ({
    value,
    onChange,
  }: {
    value: unknown;
    onChange: (value: unknown) => void;
  }) => (
    <div data-testid="rich-text-field">
      <button
        data-testid="change-delta"
        onClick={() => onChange({ ops: [{ insert: "Changed" }] })}
      >
        Change
      </button>

      <div data-testid="current-value">{JSON.stringify(value)}</div>
    </div>
  ),
}));
vi.mock("~/features/auth", () => ({
  Protected: ({ children }: { children: React.ReactNode }) => children,
}));

describe("ArchiveRichTextFieldWrapper", async () => {
  it("renders html when not editing", () => {
    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello world</p>"
        isEditing={false}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        canEdit={false}
        permissions={[]}
      />
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders fallback when html is missing", () => {
    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html={undefined}
        fallback={<p>No content</p>}
        isEditing={false}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        canEdit={false}
        permissions={[]}
      />
    );

    expect(screen.getByText("No content")).toBeInTheDocument();
  });

  it("calls onStartEdit when clicked", async () => {
    const user = userEvent.setup();
    const onStartEdit = vi.fn();

    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello</p>"
        isEditing={false}
        onStartEdit={onStartEdit}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        canEdit={true}
        permissions={[]}
      />
    );

    await user.click(screen.getByText("Hello"));

    expect(onStartEdit).toHaveBeenCalled();
  });

  it("converts html to delta in edit mode", async () => {
    const mockDelta = {
      ops: [{ insert: "Hello" }],
    } as Delta;

    vi.mocked(htmlToDelta).mockResolvedValue(mockDelta);

    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello</p>"
        isEditing={true}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        canEdit={true}
        permissions={[]}
      />
    );

    await waitFor(() => {
      expect(htmlToDelta).toHaveBeenCalledWith("<p>Hello</p>");
    });
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello</p>"
        isEditing={true}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={onCancel}
        canEdit={true}
        permissions={[]}
      />
    );

    const cancelButton = await screen.findByRole("button", {
      name: /cancel/i,
    });

    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it("converts delta to html on save", async () => {
    const user = userEvent.setup();

    const mockDelta = {
      ops: [{ insert: "Hello" }],
    } as Delta;

    vi.mocked(htmlToDelta).mockResolvedValue(mockDelta);

    vi.mocked(deltaToHtml).mockResolvedValue("<p>Hello</p>");

    const onSave = vi.fn();

    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello</p>"
        isEditing={true}
        onStartEdit={vi.fn()}
        onSave={onSave}
        onCancel={vi.fn()}
        canEdit={true}
        permissions={[]}
      />
    );

    const saveButton = await screen.findByRole("button", {
      name: /save/i,
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(deltaToHtml).toHaveBeenCalledWith(mockDelta);
      expect(onSave).toHaveBeenCalledWith("<p>Hello</p>");
    });
  });

  it("calls onDirtyChange when editor content changes", async () => {
    const user = userEvent.setup();

    const originalDelta = {
      ops: [{ insert: "Hello" }],
    } as Delta;

    vi.mocked(htmlToDelta).mockResolvedValue(originalDelta);

    const onDirtyChange = vi.fn();

    render(
      <ComplexEditableField
        id="field"
        field="Description"
        html="<p>Hello</p>"
        isEditing={true}
        onStartEdit={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        canEdit={true}
        permissions={[]}
        onDirtyChange={onDirtyChange}
      />
    );

    const changeButton = await screen.findByTestId("change-delta");

    await user.click(changeButton);

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });
});
