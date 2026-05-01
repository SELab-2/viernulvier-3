import { vi } from "vitest";

const mockQuill = {
  on: vi.fn(),
  off: vi.fn(),
  getContents: vi.fn(() => ({ ops: [] })),
  setContents: vi.fn(),
  getSelection: vi.fn(() => null),
  getLength: vi.fn(() => 1),
  root: document.createElement("div"),
};

vi.mock("react-quilljs", () => ({
  useQuill: () => ({
    quill: mockQuill,
    quillRef: { current: null },
  }),
}));