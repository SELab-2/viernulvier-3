import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogCard } from "~/features/blogs/components/BlogCard";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518998053901-5348d3961a04";

const TITLE = "Test blog title";
const CONTENT = "This is the blog content that should be visible.";

const renderCard = (
  title = TITLE,
  content = CONTENT,
  production_titles: string[] = [],
  imageUrl = DEFAULT_IMAGE
) =>
  render(
    <BlogCard
      title={title}
      content={content}
      production_titles={production_titles}
      imageUrl={imageUrl}
    />
  );

describe("BlogCard", () => {
  it("renders the given title", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
  });

  it("renders a long title without throwing", () => {
    const longTitle = "A".repeat(200);
    renderCard(longTitle);
    expect(screen.getByRole("heading", { name: longTitle })).toBeInTheDocument();
  });

  it("renders the beginning of the content text", () => {
    renderCard();
    expect(screen.getByText(CONTENT)).toBeInTheDocument();
  });

  it("renders content with newlines", () => {
    const multilineContent = "First line\nSecond line\nThird line";
    renderCard(TITLE, multilineContent);
    expect(
      screen.getByText(multilineContent, { exact: true, collapseWhitespace: false })
    ).toBeInTheDocument();
  });

  it("renders the image with the correct src", () => {
    renderCard();
    const img = screen.getByRole("img", { name: TITLE });
    expect(img).toHaveAttribute("src", DEFAULT_IMAGE);
  });

  it("renders the no-productions fallback text", () => {
    const { container } = renderCard(TITLE, CONTENT, []);
    expect(container.querySelector(".MuiChip-root")).not.toBeInTheDocument();
    expect(screen.getByText("I18N_Blog_No_Productions")).toBeInTheDocument();
    expect(screen.queryByText(/I18N_Blog_Many_Productions/)).not.toBeInTheDocument();
  });

  it("renders the production chip with the correct label for 1 production", () => {
    const ONE = ["My Productions"];
    const { container } = renderCard(TITLE, CONTENT, ONE);
    expect(container.querySelector(".MuiChip-root")).toBeInTheDocument();
    expect(screen.getByText("My Productions")).toBeInTheDocument();
    expect(screen.queryByText("I18N_Blog_No_Productions")).not.toBeInTheDocument();
    expect(screen.queryByText(/I18N_Blog_Many_Productions/)).not.toBeInTheDocument();
  });

  it("renders a chip showing the first production title + overflow count", () => {
    const THREE = ["Prod One", "Prod Two", "Prod Three"];
    const { container } = renderCard(TITLE, CONTENT, THREE);
    expect(container.querySelector(".MuiChip-root")).toBeInTheDocument();
    expect(screen.getByText("Prod One")).toBeInTheDocument();
    expect(screen.queryByText("Prod Two")).not.toBeInTheDocument();
    expect(screen.queryByText("Prod Three")).not.toBeInTheDocument();
    expect(screen.queryByText("I18N_Blog_No_Productions")).not.toBeInTheDocument();
    expect(screen.getByText(/I18N_Blog_Many_Productions/)).toBeInTheDocument();
    expect(screen.getByText(/^\+2/)).toBeInTheDocument();
  });

  it("overflow count reflects the correct number for other productioncounts", () => {
    const five = ["A", "B", "C", "D", "E"];
    renderCard(TITLE, CONTENT, five);
    expect(screen.getByText(/^\+4/)).toBeInTheDocument();
  });

  it("renders the details link", () => {
    renderCard();
    expect(screen.getByText("I18N_Blog_Details")).toBeInTheDocument();
  });
});
