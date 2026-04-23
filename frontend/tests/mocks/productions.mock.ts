import type { Production } from "~/features/archive/types/productionTypes";

export const mockProductions: Production[] = [
  {
    id_url: "http://test/api/v1/archive/productions/1",
    production_infos: [
      {
        production_id_url: "http://test/api/v1/archive/productions/1",
        language: "en",
        title: "test_production_1",
      },
    ],
    event_id_urls: [],
    earliest_at: "2026-04-16T14:42:48.359Z",
    latest_at: "2026-04-16T14:42:48.359Z",
    events: [
      {
        id_url: "http://test/api/v1/archive/events/1",
        production_id_url: "http://test/api/v1/archive/productions/1",
        price_urls: [],
        starts_at: "2026-04-16T14:42:48.359Z",
        ends_at: "2026-04-16T15:42:48.359Z",
      },
    ],
    tags: [
      {
        id_url: "http://test/api/v1/archive/events/1",
        names: [{ language: "en", name: "test_tag_1" }],
      },
    ],
  },
  {
    id_url: "http://test/api/v1/archive/productions/2",
    production_infos: [
      {
        production_id_url: "http://test/api/v1/archive/productions/2",
        language: "en",
        title: "test_production_2",
      },
    ],
    earliest_at: "2025-04-16T14:42:48.359Z",
    latest_at: "2025-04-16T14:42:48.359Z",
    event_id_urls: [],
    events: [
      {
        id_url: "http://test/api/v1/archive/events/2",
        production_id_url: "http://test/api/v1/archive/productions/2",
        price_urls: [],
        starts_at: "2025-04-16T14:42:48.359Z",
        ends_at: "2025-04-16T15:42:48.359Z",
      },
    ],
    tags: [
      {
        id_url: "http://test/api/v1/archive/events/2",
        names: [{ language: "en", name: "test_tag_2" }],
      },
    ],
  },
  {
    id_url: "http://test/api/v1/archive/productions/3",
    production_infos: [
      {
        production_id_url: "http://test/api/v1/archive/productions/3",
        language: "en",
        title: "test_production_3",
      },
    ],
    event_id_urls: [],
    earliest_at: "2026-06-16T14:42:48.359Z",
    latest_at: "2026-06-16T14:42:48.359Z",
    events: [
      {
        id_url: "http://test/api/v1/archive/events/3",
        production_id_url: "http://test/api/v1/archive/productions/3",
        price_urls: [],
        starts_at: "2026-06-16T14:42:48.359Z",
        ends_at: "2026-06-16T15:42:48.359Z",
      },
    ],
    tags: [
      {
        id_url: "http://test/api/v1/archive/events/3",
        names: [{ language: "en", name: "test_tag_3" }],
      },
    ],
  },
];
