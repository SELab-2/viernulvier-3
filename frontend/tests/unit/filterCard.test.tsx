import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterCard from "~/features/archive/components/FilterCard";

const TITLE = "Filter title";
const CHILD_TEXT = "Child content";

const renderCard = (title = TITLE, children: React.ReactNode = <p>{CHILD_TEXT}</p>) =>
  render(<FilterCard title={title}>{children}</FilterCard>);

describe("initial render", () => {
  it("renders the title", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: TITLE })).toBeInTheDocument();
  });

  it("does not render children when closed", () => {
    renderCard();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("renders the chevron icon", () => {
    const { container } = renderCard();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("chevron does not have rotate-180 class when closed", () => {
    const { container } = renderCard();
    const svg = container.querySelector("svg")!;
    expect(svg.className).not.toContain("rotate-180");
  });

  it("header does not have mb-6 class when closed", () => {
    const { container } = renderCard();
    // The clickable header div is the first child of the outer wrapper
    const header = container.querySelector("div > div")!;
    expect(header.className).not.toContain("mb-6");
  });
});

describe("opening the card", () => {
  it("shows children after clicking the header", async () => {
    renderCard();
    await userEvent.click(screen.getByRole("heading", { name: TITLE }));
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
  });

  it("adds rotate-180 to the chevron when open", async () => {
    const { container } = renderCard();
    await userEvent.click(screen.getByRole("heading", { name: TITLE }));
    const svg = container.querySelector("svg")!;
    expect(svg.classList).toContain("rotate-180");
  });

  it("adds mb-6 to the header when open", async () => {
    const { container } = renderCard();
    await userEvent.click(screen.getByRole("heading", { name: TITLE }));
    const header = container.querySelector("div > div > div")!;
    expect(header.className).toContain("mb-6");
  });
});

describe("closing the card", () => {
  it("hides children after clicking the header a second time", async () => {
    renderCard();
    const heading = screen.getByRole("heading", { name: TITLE });
    await userEvent.click(heading);
    await userEvent.click(heading);
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("removes rotate-180 from the chevron when closed again", async () => {
    const { container } = renderCard();
    const heading = screen.getByRole("heading", { name: TITLE });
    await userEvent.click(heading);
    await userEvent.click(heading);
    const svg = container.querySelector("svg")!;
    expect(svg.className).not.toContain("rotate-180");
  });

  it("removes mb-6 from the header when closed again", async () => {
    const { container } = renderCard();
    const heading = screen.getByRole("heading", { name: TITLE });
    await userEvent.click(heading);
    await userEvent.click(heading);
    const header = container.querySelector("div > div > div")!;
    expect(header.className).not.toContain("mb-6");
  });
});

describe("multiple toggles", () => {
  it("correctly alternates open/closed state across several clicks", async () => {
    renderCard();
    const heading = screen.getByRole("heading", { name: TITLE });

    // open → close → open
    await userEvent.click(heading);
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();

    await userEvent.click(heading);
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();

    await userEvent.click(heading);
    expect(screen.getByText(CHILD_TEXT)).toBeInTheDocument();
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
    await userEvent.click(screen.getByRole("heading", { name: TITLE }));
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
    await userEvent.click(screen.getByRole("heading", { name: TITLE }));
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
