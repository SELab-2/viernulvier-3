import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// mock localStorage
const store: Record<string, string> = {};

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});