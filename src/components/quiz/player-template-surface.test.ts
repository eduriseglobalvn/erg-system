import { describe, expect, it } from "vitest";

import { playerTemplateToSurfaceVars, quizThemeToneSurface } from "@/components/quiz/player-template-surface";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

describe("playerTemplateToSurfaceVars", () => {
  it("returns no vars without a template", () => {
    expect(playerTemplateToSurfaceVars(null)).toEqual({});
    expect(playerTemplateToSurfaceVars(undefined)).toEqual({});
  });

  it("maps the accent colour and picks a readable text colour on it", () => {
    const light = playerTemplateToSurfaceVars({ accentColor: "#FFE082" });
    expect(light["--quiz-accent"]).toBe("#FFE082");
    expect(light["--quiz-accent-contrast"]).toBe(t.color.text);
    const dark = playerTemplateToSurfaceVars({ accentColor: "#0071E3" });
    expect(dark["--quiz-accent"]).toBe("#0071E3");
    expect(dark["--quiz-accent-contrast"]).toBe(t.color.surface);
  });

  it("maps the highlight colour with its own readable text colour", () => {
    const vars = playerTemplateToSurfaceVars({ highlightColor: "#1B5E20" });
    expect(vars["--quiz-highlight"]).toBe("#1B5E20");
    expect(vars["--quiz-highlight-contrast"]).toBe(t.color.surface);
  });

  it("maps the background tone through the tone table", () => {
    for (const tone of ["soft-blue", "paper", "contrast"] as const) {
      expect(playerTemplateToSurfaceVars({ backgroundTone: tone })["--quiz-page-bg"]).toBe(quizThemeToneSurface[tone].background);
    }
  });

  it("squares the corners only when roundedCorners is false", () => {
    expect(playerTemplateToSurfaceVars({ roundedCorners: false })["--quiz-radius"]).toBe("0px");
    expect(playerTemplateToSurfaceVars({ roundedCorners: true })).not.toHaveProperty("--quiz-radius");
  });

  it("ignores garbage and never passes unvalidated strings into CSS", () => {
    expect(playerTemplateToSurfaceVars("red")).toEqual({});
    expect(playerTemplateToSurfaceVars([])).toEqual({});
    expect(
      playerTemplateToSurfaceVars({
        accentColor: "red; background:url(//evil)",
        highlightColor: "#12",
        backgroundTone: "constructor",
        roundedCorners: "no",
      }),
    ).toEqual({});
    expect(playerTemplateToSurfaceVars({ accentColor: 42, highlightColor: null, backgroundTone: {} })).toEqual({});
  });
});

describe("legacy editor default", () => {
  const legacy = { accentColor: "#d12b2b", highlightColor: "#ffb35c", backgroundTone: "paper", roundedCorners: false };

  it("is treated as no template, case-insensitively", () => {
    expect(playerTemplateToSurfaceVars(legacy)).toEqual({});
    expect(playerTemplateToSurfaceVars({ ...legacy, accentColor: "#D12B2B", highlightColor: "#FFB35C" })).toEqual({});
  });

  it("still applies when only one of the two colours was changed", () => {
    expect(playerTemplateToSurfaceVars({ ...legacy, accentColor: "#0071E3" })["--quiz-accent"]).toBe("#0071E3");
    expect(playerTemplateToSurfaceVars({ ...legacy, highlightColor: "#D2E6FC" })["--quiz-highlight"]).toBe("#D2E6FC");
  });
});
