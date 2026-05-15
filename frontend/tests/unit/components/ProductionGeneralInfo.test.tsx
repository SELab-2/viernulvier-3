import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductionGeneralInfo } from "~/features/archive/components/ProductionGeneralInfo";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

    expect(screen.getByText(/Live audience/i)).toBeInTheDocument();
    expect(screen.getByText(/Solo/i)).toBeInTheDocument();

    expect(
      screen.getByText(/productionPage.edit.attendance_mode/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/productionPage.edit.performer_type/i)).toBeInTheDocument();
  });
});
