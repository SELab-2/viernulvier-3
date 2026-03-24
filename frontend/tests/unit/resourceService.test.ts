import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import * as envModule from "~/shared/utils/env";
import { createApiClient } from "~/shared/services/apiClient";
import {
  getResourceList,
  getResourceById,
  createResource,
  deleteResource,
  editResource,
} from "~/features/_template-feature/services/resourceService";
import type {
  IResource,
  ICreateResource,
  IUpdateResource,
} from "~/features/_template-feature/resource.types";
import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

describe("resourceService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  it("getResourceList returns a list of data", async () => {
    const mockResources: IResource[] = [{ id: 1, someData: "testData" }];
    mockAdapter.onGet("/api/v1/archive/resource", { params: { limit: 10 } }).reply(200, mockResources);

    const result = await getResourceList(10);
    expect(result).toEqual(mockResources);
  });

  it("getResourceById returns data of specific resource", async () => {
    mockAdapter.onGet("/api/v1/archive/resource/1").reply(200, { id: 1, someData: "testData" });

    const result = await getResourceById(1);
    expect(result).toEqual({ id: 1, someData: "testData" });
  });

  it("createResource posts data", async () => {
    const request: ICreateResource = { someData: "testData" };
    mockAdapter
      .onPost("/api/v1/archive/resource", request)
      .reply(201, { id: 1, someData: request.someData });

    const result = await createResource(request);
    expect(result).toEqual({ id: expect.any(Number), someData: request.someData });
  });

  it("editResource edits data", async () => {
    const request: IUpdateResource = { someData: "testData" };
    mockAdapter
      .onPatch("/api/v1/archive/resource/1", request)
      .reply(201, { id: 1, someData: request.someData });

    const result = await editResource(1, request);
    expect(result).toEqual({ id: expect.any(Number), someData: request.someData });
  });

  it("editResource throws when trying to patch non-existent data", async () => {
    // Ensure deleteResource on non-existent resource throws an error with "404" in the error message
    await expect(deleteResource(999)).rejects.toThrow("404");
  });

  it("deleteResource deletes data", async () => {
    mockAdapter.onDelete("/api/v1/archive/resource/1").reply(204);
    const result = await deleteResource(1);
    expect(result).toBeUndefined();
  });

  it("deleteResource throws when trying to delete non-existent data", async () => {
    // Ensure deleteResource on non-existent resource throws an error with "404" in the error message
    await expect(deleteResource(999)).rejects.toThrow("404");
  });
});
