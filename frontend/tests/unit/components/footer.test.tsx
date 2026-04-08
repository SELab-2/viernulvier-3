import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Footer } from "~/shared/components/Footer";

vi.mock("react-i18next", async () => {
  const actual = await vi.importActual<typeof import("react-i18next")>("react-i18next");

  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

describe("Footer", () => {
  it("renders properly and has a link to main website", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "footer.website" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
