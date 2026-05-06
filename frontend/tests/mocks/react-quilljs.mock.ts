import type { Op } from "quill";
import { vi } from "vitest";

export const mockQuill = {
  on: vi.fn(),
  getContents: vi.fn(() => ({ ops: [] as Op[] })),
  setContents: vi.fn(),
  getSelection: vi.fn() as any,
  setSelection: vi.fn(),
  getLength: vi.fn(() => 1),
  enable: vi.fn(),
  disable: vi.fn(),
  root: document.createElement("div"),
};

function QuillMock() {
  return mockQuill;
}

export default QuillMock;
