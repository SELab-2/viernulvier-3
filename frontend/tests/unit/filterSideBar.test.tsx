import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterSidebar from "~/features/archive/components/FilterSidebar";
import type { Tag } from "~/features/archive/types/tagTypes";

vi.mock("~/i18n", () => ({
  default: { language: "nl" },
}));

vi.mock("~/features/archive/services/artistService", () => ({
  getArtists: vi.fn(),
}));

vi.mock("~/features/archive/services/tagService", () => ({
  getAllTags: vi.fn(),
  getTagByName: vi.fn(),
}));

import { getArtists } from "~/features/archive/services/artistService";
import { getAllTags, getTagByName } from "~/features/archive/services/tagService";

const makeTag = (id: string, nl: string, en: string): Tag => ({
  id_url: id,
  names: [
    { language: "nl", name: nl },
    { language: "en", name: en },
  ],
});

const TAGS: Tag[] = [
  makeTag("foo/1", "Theater", "Theater"),
  makeTag("foo/2", "Dans", "Dance"),
  makeTag("foo/3", "Concert", "Concert"),
];

const defaultProps = () => ({
  show: true,
  searchQuery: "",
  setSearchQuery: vi.fn(),
  dateFrom: "",
  setDateFrom: vi.fn(),
  dateTo: "",
  setDateTo: vi.fn(),
  selectedTags: [] as Tag[],
  setSelectedTags: vi.fn(),
  selectedArtists: [] as string[],
  setSelectedArtists: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();

  (getAllTags as ReturnType<typeof vi.fn>).mockResolvedValue(TAGS);
  (getTagByName as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
    const tag = TAGS.find((t) => t.id_url === name);
    return tag
      ? Promise.resolve(tag)
      : Promise.reject(new Error(`Tag "${name}" not found`));
  });
  (getArtists as ReturnType<typeof vi.fn>).mockResolvedValue([
    "Alice",
    "Bob",
    "Charlie",
  ]);
});

describe("FilterSidebar – search input", () => {
  it("calls setSearchQuery on change", async () => {
    const props = defaultProps();
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.search"));
    const input = screen.getByPlaceholderText("filter.search_in_collection");
    await userEvent.type(input, "a");
    expect(props.setSearchQuery).toHaveBeenCalled();
  });
});

describe("FilterSidebar – date filter", () => {
  it("calls setDateFrom when the from-date input changes", async () => {
    const props = defaultProps();
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.period"));
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: "2024-01-01" } });
    expect(props.setDateFrom).toHaveBeenCalled();
  });

  it("calls setDateTo when the to-date input changes", async () => {
    const props = defaultProps();
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.period"));
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1], { target: { value: "2024-12-31" } });
    expect(props.setDateTo).toHaveBeenCalled();
  });
});

describe("FilterSidebar – tags filter", () => {
  it("renders a non-popular selected tag in the tag list", async () => {
    const extraTag = makeTag("opera", "Opera", "Opera");
    const allTags = [...TAGS, extraTag];
    (getAllTags as ReturnType<typeof vi.fn>).mockResolvedValue(allTags);
    (getTagByName as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("not popular")
    );

    const props = { ...defaultProps(), selectedTags: [extraTag] };
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.tags"));
    await waitFor(() => screen.getByText("Opera"));
    expect(screen.getByText("Opera")).toBeInTheDocument();
  });

  it("shows tag search dropdown when tagQuery matches", async () => {
    render(<FilterSidebar {...defaultProps()} />);
    fireEvent.click(screen.getByText("filter.tags"));
    await waitFor(() => screen.getByPlaceholderText("filter.search_tags"));
    const tagInput = screen.getByPlaceholderText("filter.search_tags");
    await userEvent.type(tagInput, "dan");
    expect(screen.getByText("Dans")).toBeInTheDocument();
  });

  it("selecting a tag from the dropdown calls setSelectedTags and clears query", async () => {
    const props = defaultProps();
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.tags"));
    await waitFor(() => screen.getByPlaceholderText("filter.search_tags"));
    const tagInput = screen.getByPlaceholderText("filter.search_tags");
    await userEvent.type(tagInput, "dan");
    fireEvent.mouseDown(screen.getByText("Dans"));
    expect(props.setSelectedTags).toHaveBeenCalled();
    expect(tagInput).toHaveValue("");
  });
});

describe("FilterSidebar – artists filter", () => {
  it("calls setSelectedArtists and clears query when artist is selected from dropdown", async () => {
    const props = defaultProps();
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.artists"));
    const input = screen.getByPlaceholderText("filter.search_artists");
    await userEvent.type(input, "bob");
    await waitFor(() => screen.getByText("Bob"));
    fireEvent.mouseDown(screen.getByText("Bob"));
    expect(props.setSelectedArtists).toHaveBeenCalled();
    expect(input).toHaveValue("");
  });

  it("renders selected artist chips", () => {
    const props = { ...defaultProps(), selectedArtists: ["Alice", "Bob"] };
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.artists"));
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls setSelectedArtists to remove when chip × is clicked", () => {
    const props = { ...defaultProps(), selectedArtists: ["Alice"] };
    render(<FilterSidebar {...props} />);
    fireEvent.click(screen.getByText("filter.artists"));
    // The remove button is the only button inside the chip
    const removeBtn = screen
      .getByText("Alice")
      .closest("span")!
      .querySelector("button")!;
    fireEvent.click(removeBtn);
    expect(props.setSelectedArtists).toHaveBeenCalled();
  });
});

describe("FilterSidebar – data fetching edge cases", () => {
  it("skips rejected popular tag promises and keeps successful ones", async () => {
    (getTagByName as ReturnType<typeof vi.fn>).mockImplementation((name: string) => {
      if (name === "theater") return Promise.resolve(TAGS[0]);
      return Promise.reject(new Error("not found"));
    });
    render(<FilterSidebar {...defaultProps()} />);
    fireEvent.click(screen.getByText("filter.tags"));
    await waitFor(() => screen.getByText("Theater"));
    expect(screen.getByText("Theater")).toBeInTheDocument();
  });
});
