import { renderHook, waitFor } from "@testing-library/react";
import { useGetResourceList, useGetResourceById } from "./resourceHooks";
import * as resourceService from "../services/resourceService";
import { vi, describe, it, expect } from "vitest";
import type { IResource } from "../resource.types";
import type { UseAsyncReturn } from "~/shared/hooks/useAsyncFetch";

vi.mock("../services/resourceService");

async function waitForLoad<T>(result: { current: UseAsyncReturn<T> }): Promise<void> {
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
}

describe("resourceHooks", () => {
  describe("useGetResourceList", () => {
    it("fetches resource list with correct limit", async () => {
      const mockData: IResource[] = [{ id: 1, someData: "test" }];
      vi.mocked(resourceService.getResourceList).mockResolvedValue(mockData);

      const { result } = renderHook(() => useGetResourceList(10));
      await waitForLoad(result);

      expect(resourceService.getResourceList).toHaveBeenCalledWith(10);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it("handles error", async () => {
      const mockError = new Error("fail");
      vi.mocked(resourceService.getResourceList).mockRejectedValue(mockError);

      const { result } = renderHook(() => useGetResourceList(5));
      await waitForLoad(result);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe("useGetResourceById", () => {
    it("fetches resource by id", async () => {
      const mockData: IResource = { id: 5, someData: "data" };
      vi.mocked(resourceService.getResourceById).mockResolvedValue(mockData);

      const { result } = renderHook(() => useGetResourceById(5));
      await waitForLoad(result);

      expect(resourceService.getResourceById).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual(mockData);
    });

    it("handles error", async () => {
      const mockError = new Error("fail");
      vi.mocked(resourceService.getResourceById).mockRejectedValue(mockError);

      const { result } = renderHook(() => useGetResourceById(1));
      await waitForLoad(result);

      expect(result.current.error).toEqual(mockError);
    });
  });
});
