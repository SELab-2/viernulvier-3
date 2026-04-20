import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pageI18n = { language: "en", resolvedLanguage: "en" };

function pageTranslate(key: string) {
  const map: Record<string, string> = {
    "productionPage.backToCollection": "Back to collection",
    "productionPage.fallback.unknownProduction": "Unknown production",
    "productionPage.fallback.archive": "Archive",
    "productionPage.fallback.defaultArtist": "Unknown artist",
    "productionPage.fallback.noDescription": "No description",
    "productionPage.fallback.noEvents": "No events available",
    "productionPage.archiveSchema": "Archive schema",
    "productionPage.visualEvidence": "Visual evidence",
    "productionPage.dateLabel": "Date",
    "productionPage.placeLabel": "Place",
    "productionPage.timeLabel": "Time",
    "productionPage.priceLabel": "Price",
    "productionPage.noPrice": "No price",
  };

  return map[key] || key;
}

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: () => ({
      t: pageTranslate,
      i18n: pageI18n,
    }),
  };
});

vi.mock("~/features/archive/services/eventService", () => ({
  getEventByUrl: vi.fn(),
  getPriceByUrl: vi.fn(),
}));

vi.mock("~/features/archive/services/hallService", () => ({
  getHallByUrl: vi.fn(),
}));

vi.mock("~/features/archive/components/ProductionPageMediaGallery", () => ({
  ProductionPageMediaGallery: ({ title }: { title: string }) => (
    <div data-testid="production-media-gallery">Mock gallery for {title}</div>
  ),
}));

import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { ProductionPage } from "~/features/archive/components/ProductionPage";
import type { Production } from "~/features/archive/types/productionTypes";

function renderPage(production: Production) {
  return render(
    <MemoryRouter initialEntries={["/nl/productions/1"]}>
      <Routes>
        <Route
          path="/:lang/productions/:productionId"
          element={<ProductionPage production={production} />}
        />
      </Routes>
    </MemoryRouter>
  );
}

const baseProduction: Production = {
  id_url: "http://localhost/api/v1/archive/productions/1",
  performer_type: "Opera",
  production_infos: [
    {
      production_id_url: "http://localhost/api/v1/archive/productions/1",
      language: "nl",
      title: "Nederlandse Titel",
      supertitle: "Collectie",
      artist: "Artiest NL",
      tagline: "Nederlandse tagline",
    },
    {
      production_id_url: "http://localhost/api/v1/archive/productions/1",
      language: "en",
      title: "English Title",
      supertitle: "Collection",
      artist: "Artist EN",
      tagline: "English tagline",
    },
  ],
  event_id_urls: [],
  tags: [
    {
      id_url: "http://localhost/api/v1/archive/tags/1",
      names: [
        { language: "nl", name: "Klassiek" },
        { language: "en", name: "Classical" },
      ],
    },
  ],
};

describe("ProductionPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pageI18n.language = "en";
    pageI18n.resolvedLanguage = "en";
  });

  it("renders title, tags and gallery for the active language", async () => {
    renderPage(baseProduction);

    expect(screen.getByRole("heading", { name: "English Title" })).toBeInTheDocument();
    expect(screen.getByText("Artist EN")).toBeInTheDocument();
    expect(screen.getByText("English tagline")).toBeInTheDocument();
    expect(screen.getByText("Opera")).toBeInTheDocument();
    expect(screen.getByText("Classical")).toBeInTheDocument();
    expect(screen.getByText("Back to collection")).toBeInTheDocument();
    expect(await screen.findByTestId("production-media-gallery")).toHaveTextContent(
      "Mock gallery for English Title"
    );
  });

  it("falls back to default texts and shows no-events state", async () => {
    pageI18n.language = "fr";
    pageI18n.resolvedLanguage = "fr";

    renderPage({
      ...baseProduction,
      production_infos: [
        {
          production_id_url: "http://localhost/api/v1/archive/productions/1",
          language: "nl",
          title: "   ",
          supertitle: "",
          artist: "  ",
          tagline: "",
        },
      ],
      tags: [],
    });

    expect(
      screen.getByRole("heading", { name: "Unknown production" })
    ).toBeInTheDocument();
    expect(screen.getByText("Unknown artist")).toBeInTheDocument();
    expect(screen.getByText("No description")).toBeInTheDocument();
    expect(await screen.findByText("No events available")).toBeInTheDocument();
  });

  it("loads related event data and renders chronologically sorted events", async () => {
    const getEventByUrlMock = vi.mocked(getEventByUrl);
    const getHallByUrlMock = vi.mocked(getHallByUrl);
    const getPriceByUrlMock = vi.mocked(getPriceByUrl);

    getEventByUrlMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/2")) {
        return {
          id_url: "http://localhost/api/v1/archive/events/2",
          production_id_url: baseProduction.id_url,
          starts_at: "2026-05-10T20:00:00",
          hall: { id_url: "http://localhost/api/v1/archive/halls/2", name: "" },
          price_urls: ["http://localhost/api/v1/archive/prices/2"],
        };
      }

      return {
        id_url: "http://localhost/api/v1/archive/events/1",
        production_id_url: baseProduction.id_url,
        starts_at: "2026-05-09T18:30:00",
        hall: { id_url: "http://localhost/api/v1/archive/halls/1", name: "" },
        price_urls: ["http://localhost/api/v1/archive/prices/1"],
      };
    });

    getHallByUrlMock.mockImplementation(async (url: string) => ({
      id_url: url,
      name: url.endsWith("/2") ? "Hall Two" : "Hall One",
      location: "Antwerp",
      total_seats: 100,
    }));

    getPriceByUrlMock.mockImplementation(async (url: string) => ({
      id_url: url,
      amount: url.endsWith("/2") ? 20 : 10,
    }));

    renderPage({
      ...baseProduction,
      event_id_urls: [
        "http://localhost/api/v1/archive/events/2",
        "http://localhost/api/v1/archive/events/1",
      ],
    });

    expect(await screen.findByText("Hall One")).toBeInTheDocument();
    expect(screen.getByText("Hall Two")).toBeInTheDocument();

    const renderedDates = await screen.findAllByText(/\d+\/\d+\/2026/);
    expect(renderedDates[0]).toHaveTextContent("9/5/2026");
    expect(renderedDates[1]).toHaveTextContent("10/5/2026");
  });
});
