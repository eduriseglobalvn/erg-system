import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErgTierChip, ErgTierEmblem, ErgTierFrame } from "./erg-tier";

describe("ErgTier", () => {
  it("labels the emblem with the tier name", () => {
    render(<ErgTierEmblem tier="kc" size={64} />);
    expect(screen.getByRole("img", { name: "Kim cương" })).toBeTruthy();
  });
  it("renders the avatar unframed when there is no tier (hidden or no frame)", () => {
    const { container } = render(<ErgTierFrame tier={null} size={36}><b>MA</b></ErgTierFrame>);
    expect(container.querySelector("span")).toBeNull();
    expect(container.textContent).toBe("MA");
  });
  it("shows chip text", () => {
    render(<ErgTierChip tier="dong">Đồng 2</ErgTierChip>);
    expect(screen.getByText("Đồng 2")).toBeTruthy();
  });
});
