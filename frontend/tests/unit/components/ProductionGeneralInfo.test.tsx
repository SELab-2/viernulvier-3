import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductionGeneralInfo } from "~/features/archive/components/ProductionGeneralInfo";

vi.mock("~/shared/components/SimpleEditableField", () => ({
  default: ({
    renderView,
    value,
  }: {
    renderView: (value: string) => React.ReactNode;
    value: string;
  }) => <div>{renderView(value)}</div>,
}));

describe("ProductionGeneralInfo", () => {
  it("shows attendance mode and performer type", () => {
    render(
      <ProductionGeneralInfo
        isCreateGeneralInfo={false}
        isEditing={false}
        attendanceMode="Live audience"
        originalAttendanceMode="Live audience"
        performerType="Solo"
        originalPerformerType="Solo"
        onSave={vi.fn()}
      />
    );

    expect(screen.getByText("Live audience")).toBeInTheDocument();
    expect(screen.getByText("Solo")).toBeInTheDocument();

    expect(screen.getByText("I18N_ProductionPage_AttendanceMode:")).toBeInTheDocument();

    expect(screen.getByText("I18N_ProductionPage_PerformerType:")).toBeInTheDocument();
  });
});
