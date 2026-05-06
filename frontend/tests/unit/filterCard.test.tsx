import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterCard from "~/features/archive/components/FilterCard";

const TITLE = "Filter title";
const CHILD_TEXT = "Child content";
const ICON_ID = "filter-title-card-dropdown-icon";

const renderCard = (title = TITLE, children: React.ReactNode = <p>{CHILD_TEXT}</p>) =>
  render(<FilterCard title={title}>{children}</FilterCard>);

describe("initial render", () => {
  it("renders the title", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
  });

  it("shows children at first render", async () => {
    renderCard();
    expect(screen.getByText(CHILD_TEXT)).toBeVisible();
  });

  it("renders the chevron icon", () => {
    renderCard();
    const button = screen.getByRole("button", { name: TITLE });
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("chevron has rotate-180 class when open", () => {
    renderCard();
    const icon = document.getElementById(ICON_ID)!;
    expect(icon).toHaveClass("rotate-180");
  });

  it("header-button has mb-6 class when open", () => {
    renderCard();
    const button = screen.getByRole("button", { name: TITLE });
    expect(button).toHaveClass("mb-6");
  });

  it("is expanded by default", () => {
    renderCard();
    expect(screen.getByRole("button", { name: TITLE })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });
});

describe("closing the card", () => {
  it("hides children after clicking the header", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("button", { name: TITLE }));
    expect(screen.queryByText(CHILD_TEXT)).not.toBeVisible();
  });

  it("removes rotate-180 to the chevron when open", async () => {
    const { container } = renderCard();
    await userEvent.click(screen.getByRole("button", { name: TITLE }));
    const svg = container.querySelector("svg")!;
    expect(svg).not.toHaveClass("rotate-180");
  });

  it("removes mb-6 to the header when open", async () => {
    const { container } = renderCard();
    await userEvent.click(screen.getByRole("button", { name: TITLE }));
    const header = container.querySelector("div > div > div")!;
    expect(header).not.toHaveClass("mb-6");
  });
});

describe("closing the card", () => {
  it("shows children after clicking the header a second time", async () => {
    renderCard();
    const button = screen.getByRole("button", { name: TITLE });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(screen.queryByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it("adds rotate-180 from the chevron when closed again", async () => {
    const { container } = renderCard();
    const button = screen.getByRole("button", { name: TITLE });
    await userEvent.click(button);
    await userEvent.click(button);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveClass("rotate-180");
  });

  it("adds mb-6 from the header when closed again", async () => {
    renderCard();
    const button = screen.getByRole("button", { name: TITLE });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(button).toHaveClass("mb-6");
  });
});

describe("multiple toggles", () => {
  it("correctly alternates open/closed state across several clicks", async () => {
    renderCard();
    const button = screen.getByRole("button", { name: TITLE });

    // open → close → open
    await userEvent.click(button);
    expect(screen.queryByText(CHILD_TEXT)).not.toBeVisible();

    await userEvent.click(button);
    expect(screen.getByText(CHILD_TEXT)).toBeVisible();

    await userEvent.click(button);
    expect(screen.queryByText(CHILD_TEXT)).not.toBeVisible();

    await userEvent.click(button);
    expect(screen.getByText(CHILD_TEXT)).toBeVisible();
  });
});

describe("props", () => {
  it("renders any title string", () => {
    renderCard("My custom title");
    expect(
      screen.getByRole("heading", { name: "My custom title" })
    ).toBeInTheDocument();
  });

  it("renders complex children when open", async () => {
    render(
      <FilterCard title={TITLE}>
        <ul>
          <li>Item A</li>
          <li>Item B</li>
        </ul>
      </FilterCard>
    );
    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
  });

  it("renders multiple children nodes when open", async () => {
    render(
      <FilterCard title={TITLE}>
        <span>First</span>
        <span>Second</span>
      </FilterCard>
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
