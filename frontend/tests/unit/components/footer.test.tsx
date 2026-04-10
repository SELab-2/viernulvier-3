import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Footer, socials } from "~/shared/components/Footer";

describe("Footer", () => {
  it("renders properly and has a link to main website", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "I18N_Footer_Website" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders socials", () => {
    render(<Footer />);

    socials.forEach((social) => {
      const link = screen.getByRole("link", { name: social.label });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", social.url);
      expect(link).toHaveAttribute("target", "_blank");
    });
  });
});
