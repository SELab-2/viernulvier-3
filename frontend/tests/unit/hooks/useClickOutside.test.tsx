import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useClickOutside } from "~/shared/hooks/useClickOutside";

function TestComponent({ onOutsideClick }: { onOutsideClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, onOutsideClick);

  return (
    <div>
      <div ref={ref} data-testid="inside">
        Inside
      </div>

      <button data-testid="outside">Outside</button>
    </div>
  );
}

describe("useClickOutside", async () => {
  it("calls handler when clicking outside", async () => {
    const user = userEvent.setup();
    const onOutsideClick = vi.fn();
    render(<TestComponent onOutsideClick={onOutsideClick} />);

    await user.click(screen.getByTestId("outside"));

    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it("does not call handler when clicking inside", async () => {
    const user = userEvent.setup();
    const onOutsideClick = vi.fn();
    render(<TestComponent onOutsideClick={onOutsideClick} />);

    await user.click(screen.getByTestId("inside"));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("removes event listener on unmount", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const onOutsideClick = vi.fn();
    const { unmount } = render(<TestComponent onOutsideClick={onOutsideClick} />);

    expect(addSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
  });
});
