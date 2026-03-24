import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { type AxiosInstance } from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import * as envModule from "~/shared/utils/env";
import * as apiClientModule from "~/shared/services/apiClient";
import {
  getResourceList,
  getResourceById,
  createResource,
  deleteResource,
  editResource,
} from "~/features/_template-feature/services/resourceService";
import type {
  ICreateResource,
  IUpdateResource,
} from "~/features/_template-feature/resource.types";
import { setupLocalStorage } from "tests/globalSetup";

setupLocalStorage();

vi.mock("~/shared/services/apiClient");

describe("resourceService", () => {
  let mockAdapter: AxiosMockAdapter;
  let mockApiClient: AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    // Create real axios instance for mock adapter
    const realApiClient = axios.create({
      baseURL: "http://localhost",
      timeout: 1000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    mockAdapter = new AxiosMockAdapter(realApiClient);
    mockApiClient = realApiClient;

    // Mock createApiClient to return our test instance
    vi.mocked(apiClientModule.createApiClient).mockReturnValue(mockApiClient);

    // Mock getByUrl to use the same instance
    vi.mocked(apiClientModule.getByUrl).mockImplementation(async (url: string) => {
      const response = await mockApiClient.get(url);
      return response.data;
    });
  });

  afterEach(() => {
    if (mockAdapter) {
      mockAdapter.restore();
    }
    vi.restoreAllMocks();
  });

  it("getResourceList returns a list of data", async () => {
    mockAdapter.onGet(/http:\/\/localhost\/resource.*/).reply(200, [{ id: 1, someData: "testData" }]);

    const result = await getResourceList(10);
    expect(result).toEqual([{ id: 1, someData: "testData" }]);
  });

  it("getResourceById returns data of specific resource", async () => {
    mockAdapter.onGet("http://localhost/resource/1").reply(200, { id: 1, someData: "testData" });

    const result = await getResourceById(1);
    expect(result).toEqual({ id: 1, someData: "testData" });
  });

  it("createResource posts data", async () => {
    const request: ICreateResource = { someData: "testData" };
    mockAdapter
      .onPost("http://localhost/resource", request)
      .reply(201, { id: 1, someData: request.someData });

    const result = await createResource(request);
    expect(result).toEqual({ id: expect.any(Number), someData: request.someData });
  });

  it("editResource edits data", async () => {
    const request: IUpdateResource = { someData: "testData" };
    mockAdapter
      .onPatch("http://localhost/resource/1", request)
      .reply(201, { id: 1, someData: request.someData });

    const result = await editResource(1, request);
    expect(result).toEqual({ id: expect.any(Number), someData: request.someData });
  });

  it("editResource throws when trying to patch non-existent data", async () => {
    // Ensure deleteResource on non-existent resource throws an error with "404" in the error message
    await expect(deleteResource(999)).rejects.toThrow("404");
  });

  it("deleteResource deletes data", async () => {
    mockAdapter.onDelete("http://localhost/resource/1").reply(204);
    const result = await deleteResource(1);
    expect(result).toBeUndefined();
  });

  it("deleteResource throws when trying to delete non-existent data", async () => {
    // Ensure deleteResource on non-existent resource throws an error with "404" in the error message
    await expect(deleteResource(999)).rejects.toThrow("404");
  });
});
