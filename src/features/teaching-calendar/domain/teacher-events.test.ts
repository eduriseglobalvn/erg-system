import { expect, it } from "vitest";

import type { ErgCalendarEvent } from "@/components/shared/erg-calendar-types";
import type { TeachingCalendarEvent } from "../api/teaching-calendar-workspace-types";
import { decorateTeacherEvents, filterByRole, parseRoleFilter, roleCounts } from "./teacher-events";

const raw = (patch: Partial<TeachingCalendarEvent>) => ({
  batchId: "b1", className: "9A3", id: "e1", mainTeacherName: "T.Tuấn", myRole: "MAIN", periodStart: 4, roomName: "PM 03", schoolName: "THCS Trương Công Định", ...patch,
}) as TeachingCalendarEvent;
const mapped = (id: string) => ({ id }) as ErgCalendarEvent;

it("filters by ?role and counts per role", () => {
  const events = [raw({ id: "a" }), raw({ id: "b", myRole: "ASSISTANT" }), raw({ id: "c", myRole: "ASSISTANT" })];
  expect(roleCounts(events)).toEqual({ all: 3, assistant: 2, main: 1 });
  expect(filterByRole(events, "assistant").map((event) => event.id)).toEqual(["b", "c"]);
  expect(filterByRole(events, "main").map((event) => event.id)).toEqual(["a"]);
  expect(filterByRole(events, "all")).toHaveLength(3);
  expect(parseRoleFilter("assistant")).toBe("assistant");
  expect(parseRoleFilter("x")).toBe("all");
});

it("writes the assistant chip like the board and marks new batches", () => {
  const [assistant] = decorateTeacherEvents([raw({ myRole: "ASSISTANT" })], [mapped("e1")], new Set());
  expect(assistant.chipLines).toEqual(["TG 9A3 · T4", "Dạy chính: T.Tuấn"]);
  expect(assistant.assistant).toBe(true);
  expect(assistant.tags).toEqual(["Trợ giảng"]);
  const [main] = decorateTeacherEvents([raw({ assistantName: "Bảo Ngọc" })], [mapped("e1")], new Set(["b1"]));
  expect(main.chipLines).toEqual(["9A3 · T4 · Mới", "PM 03 · Trương Công Định"]);
  expect(main.subline).toBe("Trợ giảng: Bảo Ngọc");
  expect(main.tags).toEqual(["Mới"]);
});
