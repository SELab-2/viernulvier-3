import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
import { ProductionPage } from "~/features/archive/pages/ProductionPage";
import type { Production } from "~/features/archive/types/productionTypes";
import { AuthSessionProvider } from "~/features/auth";

function renderPage(production: Production, preferredLanguage: string = "nl") {
  const router = createMemoryRouter(
    [
      {
        path: "/:lang/productions/:productionId",
        element: (
          <ProductionPage
            production={production}
            preferredLanguage={preferredLanguage}
          />
        ),
      },
    ],
    {
      initialEntries: [`/${preferredLanguage}/productions/1`],
    }
  );

  return render(
    <AuthSessionProvider>
      <RouterProvider router={router} />
    </AuthSessionProvider>
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

const baseProductionOneInfo: Production = {
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
  });

  it("renders title, tags and gallery for the active language", async () => {
    renderPage(baseProduction, "en");

    expect(screen.getByRole("heading", { name: "English Title" })).toBeInTheDocument();
    expect(screen.getByText("Artist EN")).toBeInTheDocument();
    expect(screen.getByText("English tagline")).toBeInTheDocument();
    expect(screen.getByText("Opera")).toBeInTheDocument();
    expect(screen.getByText("Classical")).toBeInTheDocument();
    expect(screen.getByText("I18N_Production_BackToCollection")).toBeInTheDocument();
    expect(await screen.findByTestId("production-media-gallery")).toHaveTextContent(
      "Mock gallery for English Title"
    );
  });

  it("shows message that there is no information in this language", async () => {
    renderPage({ ...baseProductionOneInfo }, "en");
    const elements = await screen.findAllByText("I18N_ProductionInfo_NotAvailable");
    expect(elements).toHaveLength(2);
    // Other information should still be visisble.
    expect(screen.getByText("Opera")).toBeInTheDocument();
    expect(screen.getByText("Classical")).toBeInTheDocument();
    expect(screen.getByText("I18N_Production_BackToCollection")).toBeInTheDocument();
    expect(await screen.findByTestId("production-media-gallery")).toHaveTextContent(
      "Mock gallery for I18N_Production_Fallback_UnknownProduction"
    );
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

    renderPage(
      {
        ...baseProduction,
        event_id_urls: [
          "http://localhost/api/v1/archive/events/2",
          "http://localhost/api/v1/archive/events/1",
        ],
      },
      "nl"
    );

    expect(await screen.findByText("Hall One")).toBeInTheDocument();
    expect(screen.getByText("Hall Two")).toBeInTheDocument();

    const renderedDates = await screen.findAllByText(/\d+\/\d+\/2026/);
    expect(renderedDates[0]).toHaveTextContent("9/5/2026");
    expect(renderedDates[1]).toHaveTextContent("10/5/2026");

    // Quick check for more button
    expect(screen.getAllByText("I18N_Production_EventMore").length).toBe(2);
  });
});
