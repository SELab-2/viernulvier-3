import { vi, it, expect, beforeEach } from "vitest";
import { ArchiveRichTextField } from "~/shared/components/ArchiveRichTextField";
import { render } from "@testing-library/react";
import { mockQuill } from "tests/mocks/react-quilljs.mock"
import { Delta } from "quill";

vi.mock("react-quilljs", () => import("tests/mocks/react-quilljs.mock"));
beforeEach(() => {
  vi.clearAllMocks();
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
});

it("renders without crashing", async () => {
  const { container } = render(
    <ArchiveRichTextField onChange={() => {}} />
  );

  expect(container).toBeInTheDocument();
});

it("calls onChange when text changes", () => {
  const onChange = vi.fn();
  render(<ArchiveRichTextField onChange={onChange} />);

  const handler = mockQuill.on.mock.calls.find(([event]) => event === "text-change")?.[1];
    expect(handler).toBeDefined();
    handler?.();

  expect(onChange).toHaveBeenCalledWith({ ops: [] });
});

it("Sets aria-label on editor root", () => {
  render(<ArchiveRichTextField onChange={vi.fn()} label="Notes" />);
  expect(mockQuill.root.getAttribute("aria-label")).toBe("Notes");
});

it("cleared editor when value is null", () => {
  render(<ArchiveRichTextField onChange={vi.fn()} value={null} />);
  expect(mockQuill.setContents).toHaveBeenCalledWith([], "silent");
});

it("setContents gets called if value differs from current", () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
  mockQuill.getSelection.mockReturnValue(null);

  render(<ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} />);

  expect(mockQuill.setContents).toHaveBeenCalledWith(delta, "silent");
});

it("ensures cursor does not jump", () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
  mockQuill.getSelection.mockReturnValue({ index: 2, length: 0 });
  mockQuill.getLength.mockReturnValue(6);

  render(<ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} />);

  expect(mockQuill.setSelection).toHaveBeenCalledWith(2, 0);
});

it("setContents does not get called if value does not differ from current", () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue(delta as unknown as Delta);

  render(<ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} />);

  expect(mockQuill.setContents).not.toHaveBeenCalled();
});