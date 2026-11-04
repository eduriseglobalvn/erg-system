import { expect, test } from "vitest";

import { formatDateVi, inputDateToVi, viDateToInput } from "@/lib/format-date";

test("formats dd/MM/yyyy and never returns Invalid Date", () => {
  expect(formatDateVi("2026-11-03")).toBe("03/11/2026");
  expect(formatDateVi("2026-11-03T20:00:00.000Z")).toMatch(/^\d{2}\/\d{2}\/2026$/);
  expect(formatDateVi("not a date")).toBe("");
  expect(formatDateVi(undefined)).toBe("");
});

test("converts between dd/MM/yyyy and date-input ISO", () => {
  expect(viDateToInput("03/11/2026")).toBe("2026-11-03");
  expect(viDateToInput("2026-11-03")).toBe("");
  expect(inputDateToVi("2026-11-03")).toBe("03/11/2026");
  expect(inputDateToVi("")).toBe("");
});
