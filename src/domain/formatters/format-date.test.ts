import { expect, test, vi } from "vitest";

import { formatDateTimeVi, formatDateVi, inputDateToVi, todayInput, viDateToInput } from "@/domain/formatters/format-date";

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

test("formatDateTimeVi is local dd/MM/yyyy HH:mm and empty when invalid", () => {
  expect(formatDateTimeVi(new Date(2026, 10, 4, 6, 5))).toBe("04/11/2026 06:05");
  expect(formatDateTimeVi("not-a-date")).toBe("");
  expect(formatDateTimeVi(null)).toBe("");
});

test("todayInput uses the local day, not the UTC day", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 4, 0, 30)); // 00:30 local; UTC may still be the previous day
  expect(todayInput()).toBe("2026-11-04");
  vi.useRealTimers();
});
