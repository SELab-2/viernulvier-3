import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import * as envModule from "~/shared/utils/env";
import AxiosMockAdapter from "axios-mock-adapter";
import { createApiClient } from "~/shared/services/apiClient";
import { getArtists } from "~/features/archive/services/artistService";

describe("artistService", () => {
  let mockAdapter: AxiosMockAdapter;

  beforeEach(() => {
    vi.spyOn(envModule, "getEnv").mockReturnValue({
      API_BASE_URL: "http://localhost",
    });

    const apiClient = createApiClient();
    mockAdapter = new AxiosMockAdapter(apiClient);
    vi.spyOn(axios, "create").mockReturnValue(apiClient);
  });

  const MOCK_RESPONSE = {
    en: ["Artist A", "Artist B", "Artiest C"],
    nl: ["Artiest A", "Artiest B", "Artiest C"],
  };

  describe("getArtists", () => {
    it("returns the nl list when lang_code is 'nl'", async () => {
      mockAdapter.onGet("/api/v1/archive/artists").reply(200, MOCK_RESPONSE);

      const result = await getArtists("nl");

      expect(result).toEqual(MOCK_RESPONSE.nl);
    });

    it("returns the en list when lang_code is 'en'", async () => {
      mockAdapter.onGet("/api/v1/archive/artists").reply(200, MOCK_RESPONSE);

      const result = await getArtists("en");

      expect(result).toEqual(MOCK_RESPONSE.en);
    });

    it("throws when the request fails", async () => {
      mockAdapter.onGet("/api/v1/archive/artists").reply(500);

      await expect(getArtists("nl")).rejects.toThrow();
    });
  });
});
