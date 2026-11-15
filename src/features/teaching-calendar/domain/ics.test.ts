import { expect, it } from "vitest";

import { buildIcs, foldLine, icsFileName } from "./ics";

const event = { date: "2026-11-11", description: "Trợ giảng cho T.Tuấn", endTime: "14:15", id: "e1", location: "PM 03\, THCS Trương Công Định", startTime: "13:30", summary: "9A4 · Tiết 6" };

it("emits a CRLF calendar with the Ho Chi Minh time zone and one VEVENT per period", () => {
  const ics = buildIcs([event], new Date("2026-11-15T03:04:05.678Z"));
  expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  expect(ics).toContain("TZID:Asia/Ho_Chi_Minh");
  expect(ics).toContain("DTSTART;TZID=Asia/Ho_Chi_Minh:20261111T133000");
  expect(ics).toContain("DTEND;TZID=Asia/Ho_Chi_Minh:20261111T141500");
  expect(ics).toContain("DTSTAMP:20261115T030405Z");
  expect(ics).toContain("UID:e1@erg.edu.vn");
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
});

it("escapes commas and semicolons in text values", () => {
  expect(buildIcs([event])).toContain("LOCATION:PM 03\\, THCS Trương Công Định");
});

it("folds lines longer than 75 octets", () => {
  const folded = foldLine(`SUMMARY:${"Tiết dạy ".repeat(20)}`);
  expect(folded).toContain("\r\n ");
  for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
});

it("names the file by today's date", () => {
  expect(icsFileName("15/11/2026")).toBe("lich-day-15-11-2026.ics");
});
