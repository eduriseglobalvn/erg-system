import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Teacher PWA calendar and action-button policy", () => {
  it("defines the ERG blue token family used by mobile action buttons", () => {
    const source = readFileSync(resolve("src/styles/globals.css"), "utf8");

    expect(source).toContain("--erg-blue:");
    expect(source).toContain("--erg-blue-hover:");
    expect(source).toContain("--erg-blue-light:");
    expect(source).toContain("--erg-blue-ring:");
  });

  it("keeps the quick-assign action bound to an explicit ERG token", () => {
    const source = readFileSync(resolve("src/features/lms/components/exercise-bank/mobile-exercise-bank-view.tsx"), "utf8");

    expect(source).toContain("onAssign(exercise.title)");
    expect(source).toContain("!bg-[var(--erg-blue)]");
    expect(source).toContain("!text-white");
    expect(source).toContain("!border-[#d9e2ef]");
  });

  it("selects agenda as the mobile calendar default without removing desktop week view", () => {
    const source = readFileSync(resolve("src/features/lms/components/teaching-schedule/lms-erg-calendar-workspace.tsx"), "utf8");

    expect(source).toContain("useLmsMobileBreakpoint");
    expect(source).toContain('initialMode={isMobile ? "schedule" : "week"}');
  });

  it("exposes a stable calendar workspace test hook", () => {
    const source = readFileSync(resolve("src/components/shared/erg-calendar-workspace-shell.tsx"), "utf8");

    expect(source).toContain('data-testid="erg-calendar-workspace"');
    expect(source).toContain("data-calendar-mode={mode}");
  });
});
