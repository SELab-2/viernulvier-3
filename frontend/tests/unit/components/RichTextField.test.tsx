import { vi, it, expect, beforeEach } from "vitest";
import { ArchiveRichTextField } from "~/shared/components/ArchiveRichTextField";
import { act, render } from "@testing-library/react";
import { mockQuill } from "tests/mocks/react-quilljs.mock";
import type { Delta } from "quill";

vi.mock("quill", async () => {
  const mock = await import("tests/mocks/react-quilljs.mock");
  return { default: mock.default };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
});

// Helper om de dynamische import te laten resolven
const flushPromises = () => act(() => Promise.resolve());

it("renders without crashing", async () => {
  const { container } = render(
    <ArchiveRichTextField onChange={() => {}} canEdit={false} />
  );
  await flushPromises();
  expect(container).toBeInTheDocument();
});

it("calls onChange when text changes", async () => {
  const onChange = vi.fn();
  render(<ArchiveRichTextField onChange={onChange} canEdit={false} />);
  await flushPromises();
  const handler = mockQuill.on.mock.calls.find(
    ([event]) => event === "text-change"
  )?.[1];
  expect(handler).toBeDefined();
  handler?.();

  expect(onChange).toHaveBeenCalledWith({ ops: [] });
});

it("Sets aria-label on editor root", async () => {
  render(<ArchiveRichTextField onChange={vi.fn()} label="Notes" canEdit={false} />);
  await flushPromises();
  expect(mockQuill.root.getAttribute("aria-label")).toBe("Notes");
});

it("cleared editor when value is null", async () => {
  render(<ArchiveRichTextField onChange={vi.fn()} value={null} canEdit={false} />);
  await flushPromises();
  expect(mockQuill.setContents).toHaveBeenCalledWith([], "silent");
});

it("setContents gets called if value differs from current", async () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
  mockQuill.getSelection.mockReturnValue(null);

  render(
    <ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} canEdit={false} />
  );
  await flushPromises();
  expect(mockQuill.setContents).toHaveBeenCalledWith(delta, "silent");
});

it("ensures cursor does not jump", async () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue({ ops: [] } as unknown as Delta);
  mockQuill.getSelection.mockReturnValue({ index: 2, length: 0 } as unknown as Range);
  mockQuill.getLength.mockReturnValue(6);

  render(
    <ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} canEdit={false} />
  );
  await flushPromises();
  expect(mockQuill.setSelection).toHaveBeenCalledWith(2, 0);
});

it("setContents does not get called if value does not differ from current", async () => {
  const delta = { ops: [{ insert: "hello" }] };
  mockQuill.getContents.mockReturnValue(delta as unknown as Delta);

  render(
    <ArchiveRichTextField onChange={vi.fn()} value={delta as Delta} canEdit={false} />
  );
  await flushPromises();
  expect(mockQuill.setContents).toHaveBeenCalledTimes(1);
});
