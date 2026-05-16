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

vi.mock("~/features/blogs/services/blogService", () => ({
  getBlogsForProduction: vi.fn(),
}));

vi.mock("~/features/archive/services/productionGroupService", () => ({
  getProductionGroupByUrl: vi.fn(),
  getProductionsForGroup: vi.fn(),
}));

vi.mock("~/features/archive/services/productionService", () => ({
  getProductionByUrl: vi.fn(),
}));

vi.mock("~/features/archive/components/ProductionPageMediaGallery", () => ({
  ProductionPageMediaGallery: ({ title }: { title: string }) => (
    <div data-testid="production-media-gallery">Mock gallery for {title}</div>
  ),
}));

import { getEventByUrl, getPriceByUrl } from "~/features/archive/services/eventService";
import { getHallByUrl } from "~/features/archive/services/hallService";
import { getBlogsForProduction } from "~/features/blogs/services/blogService";
import { getProductionByUrl } from "~/features/archive/services/productionService";
import { ProductionPage } from "~/features/archive/pages/ProductionPage";
import type { Production } from "~/features/archive/types/productionTypes";
import type { Hall, HallName } from "~/features/archive/types/hallTypes";
import { AuthSessionProvider } from "~/features/auth";
import type { Event, Price } from "~/features/archive/types/eventTypes";
import type { ProductionGroup } from "~/features/archive/types/productionGroupTypes";
import {
  getProductionGroupByUrl,
  getProductionsForGroup,
} from "~/features/archive/services/productionGroupService";

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

const baseProdGroup: ProductionGroup = {
  id_url: "http://localhost/api/v1/archive/series/1",
  title: "foo",
  is_public_filter: true,
  production_id_urls: [],
};

describe("ProductionPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getBlogsForProduction).mockResolvedValue([]);
    vi.mocked(getProductionGroupByUrl).mockResolvedValue(baseProdGroup);
    vi.mocked(getProductionsForGroup).mockResolvedValue([]);
    vi.mocked(getProductionByUrl).mockResolvedValue({
      id_url: "",
      event_id_urls: [],
      production_infos: [
        { language: "en", title: "Mock Production", production_id_url: "" },
      ],
      tags: [],
    });
  });

  it("renders title, tags and gallery for the active language", async () => {
    renderPage(baseProduction, "en");

    expect(screen.getByRole("heading", { name: "English Title" })).toBeInTheDocument();
    expect(screen.getByText("Artist EN")).toBeInTheDocument();
    expect(screen.getByText("English tagline")).toBeInTheDocument();
    expect(screen.getAllByText("Opera")[0]).toBeInTheDocument();
    expect(screen.getByText("Classical")).toBeInTheDocument();
    expect(screen.getByText("I18N_Production_BackToCollection")).toBeInTheDocument();
    expect(await screen.findByTestId("production-media-gallery")).toHaveTextContent(
      "Mock gallery for English Title"
    );
  });

  it("shows message that there is no information in this language", async () => {
    renderPage({ ...baseProductionOneInfo }, "en");
    const elements = await screen.findAllByText(
      "I18N_Production_Fallback_UnknownProduction"
    );
    expect(elements).toHaveLength(1);
    // Other information should still be visisble.
    expect(screen.getAllByText("Opera")[0]).toBeInTheDocument();
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
    const getMockHall = (url: string): HallName => {
      return {
        language: "en",
        name: url.endsWith("/2") ? "Hall Two" : "Hall One",
      };
    };

    getEventByUrlMock.mockImplementation(async (url: string): Promise<Event> => {
      if (url.endsWith("/2")) {
        return {
          id_url: "http://localhost/api/v1/archive/events/2",
          production_id_url: baseProduction.id_url,
          starts_at: "2026-05-10T20:00:00",
          hall: { id_url: "http://localhost/api/v1/archive/halls/2", names: [] },
          price_urls: ["http://localhost/api/v1/archive/prices/2"],
        };
      }

      return {
        id_url: "http://localhost/api/v1/archive/events/1",
        production_id_url: baseProduction.id_url,
        starts_at: "2026-05-09T18:30:00",
        hall: { id_url: "http://localhost/api/v1/archive/halls/1", names: [] },
        price_urls: ["http://localhost/api/v1/archive/prices/1"],
      };
    });

    getHallByUrlMock.mockImplementation(
      async (url: string): Promise<Hall> => ({
        id_url: url,
        names: [getMockHall(url)],
        address: "Antwerp",
      })
    );

    getPriceByUrlMock.mockImplementation(
      async (url: string): Promise<Price> => ({
        id_url: url,
        amount: url.endsWith("/2") ? 20 : 10,
      })
    );

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

    expect(screen.getByText("18:30")).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();

    // Quick check for more button
    expect(screen.getAllByText("I18N_Production_EventMore").length).toBe(2);
  });

  it("renders linked blogs section when blogs are available", async () => {
    const getBlogsForProductionMock = vi.mocked(getBlogsForProduction);
    const mockBlogs = [
      {
        id_url: "http://localhost/api/v1/archive/blogs/1",
        series_id_url: "http://localhost/api/v1/archive/series/1",
        blog_contents: [
          {
            blog_id_url: "http://localhost/api/v1/archive/blogs/1",
            language: "en",
            title: "Blog Title 1",
            content: "Blog content 1",
          },
        ],
      },
      {
        id_url: "http://localhost/api/v1/archive/blogs/2",
        series_id_url: "http://localhost/api/v1/archive/series/2",
        blog_contents: [
          {
            blog_id_url: "http://localhost/api/v1/archive/blogs/2",
            language: "en",
            title: "Blog Title 2",
            content: "Blog content 2",
          },
        ],
      },
    ];

    getBlogsForProductionMock.mockResolvedValueOnce(mockBlogs);

    renderPage(baseProduction, "en");

    // Check that the blogs are loaded and rendered
    expect(await screen.findByText("Blog Title 1")).toBeInTheDocument();
    expect(screen.getByText("Blog Title 2")).toBeInTheDocument();
  });

  it("does not render linked blogs section when no blogs are available", async () => {
    const getBlogsForProductionMock = vi.mocked(getBlogsForProduction);
    getBlogsForProductionMock.mockResolvedValueOnce([]);

    renderPage(baseProduction, "en");

    // The blogs section should not be rendered if there are no blogs
    // i18n key for "I18N_ProductionPage_LinkedBlogs" should not appear
    expect(
      screen.queryByText("I18N_ProductionPage_LinkedBlogs")
    ).not.toBeInTheDocument();
  });

  it("handles blog loading error gracefully", async () => {
    const getBlogsForProductionMock = vi.mocked(getBlogsForProduction);
    getBlogsForProductionMock.mockRejectedValueOnce(new Error("Failed to load blogs"));

    renderPage(baseProduction, "en");

    // Page should still render without blogs
    expect(screen.getByRole("heading", { name: "English Title" })).toBeInTheDocument();
    expect(
      screen.queryByText("I18N_ProductionPage_LinkedBlogs")
    ).not.toBeInTheDocument();
  });
});
