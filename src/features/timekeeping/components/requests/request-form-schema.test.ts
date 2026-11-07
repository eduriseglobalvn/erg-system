import { describe, expect, it } from "vitest";

import { parseRequestsSearch } from "./request-model";
import { validateExplanation, validateLeave, type ExplanationFormValues, type LeaveFormValues } from "./request-form-schema";

const LEAVE: LeaveFormValues = { kind: "ANNUAL", from: "2026-11-10", to: "2026-11-11", part: "FULL", reason: "Việc gia đình" };
const EXPLANATION: ExplanationFormValues = { date: "2026-10-14", reason: "FORGOT", proposedOut: "11:30", note: "" };

describe("validateLeave", () => {
  it("accepts a valid range and a single day", () => {
    expect(validateLeave(LEAVE)).toEqual({});
    expect(validateLeave({ ...LEAVE, to: LEAVE.from })).toEqual({});
  });

  it("rejects an end date before the start date", () => {
    expect(validateLeave({ ...LEAVE, to: "2026-11-09" })).toEqual({ to: "Ngày kết thúc phải sau ngày bắt đầu" });
  });

  it("requires a reason", () => {
    expect(validateLeave({ ...LEAVE, reason: "   " })).toEqual({ reason: "Nhập lý do" });
  });

  it("allows a half day on a single day only", () => {
    expect(validateLeave({ ...LEAVE, part: "AM", to: LEAVE.from })).toEqual({});
    expect(validateLeave({ ...LEAVE, part: "AM" }).part).toBe("Nghỉ buổi sáng hoặc buổi chiều chỉ áp dụng cho một ngày");
  });
});

describe("validateExplanation", () => {
  it("accepts a filled form with explanations left", () => {
    expect(validateExplanation(EXPLANATION, { remaining: 2 })).toEqual({});
  });

  it("blocks the form when no explanation is left this month", () => {
    expect(validateExplanation(EXPLANATION, { remaining: 0 })).toEqual({ form: "Đã dùng hết 3 lượt giải trình tháng này" });
  });

  it("asks for the proposed OUT time when the punch was forgotten or the device failed", () => {
    expect(validateExplanation({ ...EXPLANATION, proposedOut: "" }, { remaining: 1 })).toEqual({ proposedOut: "Chọn giờ ra đề nghị" });
    expect(validateExplanation({ ...EXPLANATION, reason: "OUTSIDE", proposedOut: "" }, { remaining: 1 })).toEqual({});
  });
});

describe("parseRequestsSearch", () => {
  it("maps search params to the views", () => {
    expect(parseRequestsSearch({})).toEqual({ view: "list" });
    expect(parseRequestsSearch({ new: "" })).toEqual({ view: "picker" });
    expect(parseRequestsSearch({ new: "picker" })).toEqual({ view: "picker" });
    expect(parseRequestsSearch({ new: "explanation", date: "2026-10-14" })).toEqual({ view: "form", type: "explanation", date: "2026-10-14" });
    expect(parseRequestsSearch({ new: "leave", date: "14/10" })).toEqual({ view: "form", type: "leave", date: undefined });
    expect(parseRequestsSearch({ edit: "r1" })).toEqual({ view: "edit", id: "r1" });
    expect(parseRequestsSearch({ id: "r1", new: "leave" })).toEqual({ view: "detail", id: "r1" });
    expect(parseRequestsSearch({ id: 5 })).toEqual({ view: "list" });
    expect(parseRequestsSearch({ new: "explanation", date: "2026-13-45" })).toEqual({ view: "form", type: "explanation", date: undefined });
  });
});
