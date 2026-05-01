import { vi } from "vitest";
import { Delta } from "quill";

export const mockQuill = {
    on: vi.fn(),
    off: vi.fn(),
    getContents: vi.fn(() => ({ ops: [] }) as unknown as Delta),
    setContents: vi.fn(),
    getSelection: vi.fn(() => null as { index: number; length: number } | null),
    setSelection: vi.fn(),
    getLength: vi.fn(() => 1),
    root: document.createElement("div"),
};

export const useQuill = vi.fn(() => ({
    quill: mockQuill,
    quillRef: { current: null },
}));