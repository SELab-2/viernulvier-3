import type { Delta } from "quill";

export async function htmlToDelta(html: string): Promise<Delta> {
  const { default: Quill } = await import("quill");
  const container = document.createElement("div");
  const quill = new Quill(container);
  quill.clipboard.dangerouslyPasteHTML(html);
  return quill.getContents();
}

export async function deltaToHtml(delta: Delta): Promise<string> {
  const { default: Quill } = await import("quill");
  const container = document.createElement("div");
  const quill = new Quill(container);
  quill.setContents(delta);
  return quill.root.innerHTML;
}