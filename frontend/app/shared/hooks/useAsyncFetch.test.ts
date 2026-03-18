import { renderHook, act } from "@testing-library/react";
import { useAsyncFetch } from "./useAsyncFetch";
import { describe, expect, it, vi } from "vitest";

describe("useAsyncFetch", () => {
  it("should handle successful async call", async () => {
    const mockData = { foo: "bar" };
    const asyncFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useAsyncFetch(asyncFn));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for update
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("should handle error correctly", async () => {
    const mockError = new Error("fail");
    const asyncFn = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useAsyncFetch(asyncFn));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it("should properly refresh data", async () => {
    const asyncFn = vi.fn().mockResolvedValue("data");
    const { result } = renderHook(() => useAsyncFetch(asyncFn));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toBe("data");

    // Change the return value of our asyncFn so that it requires a refresh
    asyncFn.mockResolvedValue("other data");
    await act(async () => {
      result.current.refresh();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toBe("other data");
  });
});
