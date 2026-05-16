import { describe, expect, it } from "vitest";
import { deltaToHtml, htmlToDelta } from "~/archive-rich-text.client";

describe("htmlToDelta", () => {
  it("converts plain text html to delta", async () => {
    const delta = await htmlToDelta("<p>Hello world</p>");

    expect(delta.ops).toEqual([{ insert: "Hello world\n" }]);
  });

  it("converts bold text", async () => {
    const delta = await htmlToDelta("<p><strong>Hello</strong></p>");

    expect(delta.ops).toEqual([
      {
        insert: "Hello",
        attributes: { bold: true },
      },
      { insert: "\n" },
    ]);
  });

  it("handles empty html", async () => {
    const delta = await htmlToDelta("");

    expect(delta.ops).toEqual([{ insert: "\n" }]);
  });
});

// Tests for deltaToHtml not directly covered because very annoying to create
// a Delta object

describe("round-trip conversions", () => {
  it("preserves content through html -> delta -> html", async () => {
    const input = "<p>Hello <strong>world</strong></p>";

    const delta = await htmlToDelta(input);
    const html = await deltaToHtml(delta);

    expect(html).toContain("Hello");
    expect(html).toContain("<strong>world</strong>");
  });
});
