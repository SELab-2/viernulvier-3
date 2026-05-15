import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";

import { getAllTags } from "~/features/archive/services/tagService";
import type { Tag } from "~/features/archive/types/tagTypes";
import Tags from "~/features/archive/components/TagSection";

vi.mock("~/features/archive/services/tagService", () => ({
  getAllTags: vi.fn(),
}));

const mockTags: Tag[] = [
  {
    id_url: "tag-1",
    names: [
      { language: "en", name: "Classical" },
      { language: "nl", name: "Klassiek" },
    ],
  },
  {
    id_url: "tag-2",
    names: [
      { language: "en", name: "Experimental" },
      { language: "nl", name: "Experimenteel" },
    ],
  },
];

function TagsTestWrapper({
  initialTags,
  isEditing = true,
}: {
  initialTags: Tag[];
  isEditing?: boolean;
}) {
  const [draftTags, setDraftTags] = useState(initialTags);
  vi.mocked(getAllTags).mockResolvedValue(mockTags);

  return (
    <Tags
      performer_type="Group"
      originalTags={initialTags}
      draftTags={draftTags}
      setDraftTags={setDraftTags}
      isEditing={isEditing}
      preferredLanguage="en"
    />
  );
}

describe("Tags", () => {
  it("renders performer type and tags", () => {
    render(<TagsTestWrapper initialTags={[mockTags[0]]} />);

    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("Classical")).toBeInTheDocument();
  });

  it("adds a tag from the dropdown", async () => {
    const user = userEvent.setup();
    vi.mocked(getAllTags).mockResolvedValue(mockTags);
    render(<TagsTestWrapper initialTags={[mockTags[0]]} />);

    await user.click(screen.getByLabelText("Add Tag"));
    await user.click(await screen.findByText("Experimental"));
    expect(screen.getByText("Experimental")).toBeInTheDocument();
  });

  it("removes a tag", async () => {
    const user = userEvent.setup();
    render(<TagsTestWrapper initialTags={[mockTags[0]]} />);

    expect(screen.getByText("Classical")).toBeInTheDocument();

    await user.click(screen.getByLabelText("remove-Classical"));

    expect(screen.queryByText("Classical")).not.toBeInTheDocument();
  });

  it("filters tags based on search", async () => {
    const user = userEvent.setup();
    render(<TagsTestWrapper initialTags={[]} />);

    await user.click(screen.getByLabelText("Add Tag"));

    const input = screen.getByRole("textbox");
    await user.type(input, "exp");

    expect(screen.getByText("Experimental")).toBeInTheDocument();
    expect(screen.queryByText("Classical")).not.toBeInTheDocument();
  });

  it("does not show already selected tags", async () => {
    const user = userEvent.setup();
    vi.mocked(getAllTags).mockResolvedValue(mockTags);
    render(<TagsTestWrapper initialTags={[mockTags[0]]} />);

    await user.click(screen.getByLabelText("Add Tag"));

    const dropdown = screen.getByTestId("tag-dropdown");
    expect(within(dropdown).queryByText("Classical")).not.toBeInTheDocument();
    expect(within(dropdown).getByText("Experimental")).toBeInTheDocument();
  });
});
