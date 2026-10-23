import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

test("keeps the calendar public facade below 300 lines and delegates cohesive UI owners", () => {
  const facade = read("src/components/shared/erg-calendar-workspace.tsx");
  expect(facade.split(/\r?\n/).length).toBeLessThanOrEqual(300);

  const shell = read("src/components/shared/erg-calendar-workspace-shell.tsx");
  for (const owner of [
    "./erg-calendar-navigator",
    "./erg-calendar-board",
    "./erg-calendar-event-detail",
    "./teaching-schedule-dialog",
  ]) {
    expect(shell).toContain(owner);
  }
});
