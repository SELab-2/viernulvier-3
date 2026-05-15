import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArchiveTextField } from "~/shared/components/ArchiveTextField";
import { TextField } from "@mui/material";

vi.mock("@mui/material", async () => {
  const actual = await vi.importActual("@mui/material");

  return {
    ...actual,
    TextField: vi.fn(() => <div data-testid="mock-text-field" />),
  };
});

describe("ArchiveTextField", async () => {
  it("renders TextField", () => {
    render(<ArchiveTextField />);
    expect(screen.getByTestId("mock-text-field")).toBeInTheDocument();
  });

  it("passes additional props to TextField", () => {
    render(<ArchiveTextField label="Title" placeholder="Enter title" />);

    expect(TextField).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Title",
        placeholder: "Enter title",
      }),
      undefined
    );
  });

  it("passes additional props to TextField as object", () => {
    render(
      <ArchiveTextField
        sx={{
          label: "Title",
          placeholder: "Enter title",
        }}
      />
    );

    expect(TextField).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Title",
        placeholder: "Enter title",
      }),
      undefined
    );
  });

  it("passes additional props to TextField as array", () => {
    render(
      <ArchiveTextField sx={[{ label: "Title" }, { placeholder: "Enter title" }]} />
    );

    expect(TextField).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Title",
        placeholder: "Enter title",
      }),
      undefined
    );
  });

  it("passes onChange to TextField", async () => {
    const handleChange = vi.fn();

    render(<ArchiveTextField onChange={handleChange} />);

    expect(TextField).toHaveBeenCalledWith(
      expect.objectContaining({
        onChange: handleChange,
      }),
      undefined
    );
  });
});
