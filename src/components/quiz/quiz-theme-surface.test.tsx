import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuizThemeSurface } from "@/components/quiz/quiz-theme-surface";

const surface = (playerTemplate?: unknown) =>
  render(<QuizThemeSurface quiz={{ playerTemplate }}>x</QuizThemeSurface>).container.firstElementChild as HTMLElement;

describe("QuizThemeSurface player template", () => {
  it("sets the template vars and page background on top of settings.theme", () => {
    const el = surface({ accentColor: "#0071E3", backgroundTone: "paper", roundedCorners: false });
    expect(el.style.getPropertyValue("--quiz-accent")).toBe("#0071E3");
    expect(el.style.getPropertyValue("--quiz-radius")).toBe("0px");
    expect(el.style.getPropertyValue("--quiz-player-bg")).not.toBe("");
    expect(el.style.background).not.toBe("");
  });

  it("leaves the player on settings.theme alone without a usable template", () => {
    for (const template of [undefined, "red", { accentColor: "url(x)" }]) {
      const el = surface(template);
      expect(el.style.getPropertyValue("--quiz-accent")).toBe("");
      expect(el.style.background).toBe("");
      expect(el.style.getPropertyValue("--quiz-player-bg")).not.toBe("");
    }
  });
});
