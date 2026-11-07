import { describe, expect, test } from "vitest";

import { addPicked, emptyDraft } from "./audience-draft";
import {
  type CampaignFormValues,
  emptyCampaignForm,
  formatCountVi,
  fromCampaign,
  isoToLocalInput,
  localInputToIso,
  toDraftRequest,
  validateCampaignForm,
} from "./campaign-form-schema";

const now = new Date(2026, 10, 7, 9, 30); // 07/11/2026 09:30 local
const withPerson = addPicked(emptyDraft("PEOPLE"), [{ userId: "u1", displayName: "Minh", role: "STUDENT" }]);
const valid = (patch: Partial<CampaignFormValues> = {}): CampaignFormValues => ({
  ...emptyCampaignForm(),
  title: "Họp phụ huynh",
  body: "Nội dung",
  audience: withPerson,
  ...patch,
});

describe("validateCampaignForm", () => {
  test("a complete form has no errors", () => {
    expect(validateCampaignForm(valid(), now)).toEqual({});
  });

  test("empty title", () => {
    expect(validateCampaignForm(valid({ title: "  " }), now).title).toBe("Nhập tiêu đề");
  });

  test("title over 120 characters", () => {
    expect(validateCampaignForm(valid({ title: "a".repeat(121) }), now).title).toBe("Tối đa 120 ký tự");
  });

  test("body of 2,001 characters", () => {
    expect(validateCampaignForm(valid({ body: "a".repeat(2001) }), now).body).toBe("Tối đa 2.000 ký tự");
    expect(validateCampaignForm(valid({ body: "a".repeat(2000) }), now).body).toBeUndefined();
  });

  test("empty body", () => {
    expect(validateCampaignForm(valid({ body: "" }), now).body).toBe("Nhập nội dung");
  });

  test("scheduled time before now", () => {
    expect(validateCampaignForm(valid({ sendMode: "schedule", scheduledAt: "2026-11-07T09:00" }), now).scheduledAt).toBe(
      "Thời điểm hẹn phải ở tương lai",
    );
  });

  test("scheduled time more than 30 days ahead, missing time, and a valid one", () => {
    expect(validateCampaignForm(valid({ sendMode: "schedule", scheduledAt: "2026-12-07T09:31" }), now).scheduledAt).toBe(
      "Chỉ hẹn trong 30 ngày tới",
    );
    expect(validateCampaignForm(valid({ sendMode: "schedule", scheduledAt: "" }), now).scheduledAt).toBe("Chọn thời điểm hẹn");
    expect(validateCampaignForm(valid({ sendMode: "schedule", scheduledAt: "2026-11-08T07:00" }), now).scheduledAt).toBeUndefined();
  });

  test("schedule is ignored when sending now", () => {
    expect(validateCampaignForm(valid({ sendMode: "now", scheduledAt: "2020-01-01T00:00" }), now).scheduledAt).toBeUndefined();
  });

  test("no recipients", () => {
    expect(validateCampaignForm(valid({ audience: emptyDraft() }), now).audience).toBe("Chọn ít nhất một người nhận");
  });
});

describe("local schedule time", () => {
  test("is read as local wall-clock time", () => {
    expect(localInputToIso("2026-11-08T07:00")).toBe(new Date(2026, 10, 8, 7, 0).toISOString());
    expect(localInputToIso("08/11/2026")).toBeNull();
    expect(localInputToIso("2026-02-30T07:00")).toBeNull();
  });

  test("round-trips through ISO", () => {
    expect(isoToLocalInput(localInputToIso("2026-11-08T23:05") ?? "")).toBe("2026-11-08T23:05");
    expect(isoToLocalInput("not a date")).toBe("");
  });
});

test("formatCountVi uses the dot thousands separator", () => {
  expect(formatCountVi(1336)).toBe("1.336");
  expect(formatCountVi(2000)).toBe("2.000");
  expect(formatCountVi(7)).toBe("7");
});

test("toDraftRequest trims and sends the active scope only", () => {
  const draft = toDraftRequest(valid({ title: " T ", body: " B ", priority: "URGENT", requireReadAck: true, pushEnabled: false }));
  expect(draft).toMatchObject({ title: "T", body: "B", priority: "URGENT", requireReadAck: true, pushEnabled: false });
  expect(draft.audience).toMatchObject({ userIds: ["u1"], wholeTenant: false });
});

test("fromCampaign restores the scope, ids and schedule", () => {
  const values = fromCampaign({
    id: "c1",
    title: "T",
    body: "B",
    priority: "IMPORTANT",
    requireReadAck: true,
    pushEnabled: false,
    status: "SCHEDULED",
    scheduledAt: new Date(2026, 10, 8, 7, 0).toISOString(),
    audience: { classIds: ["k7a"], userIds: ["u9"] },
  });
  expect(values).toMatchObject({ title: "T", body: "B", priority: "IMPORTANT", requireReadAck: true, pushEnabled: false, sendMode: "schedule", scheduledAt: "2026-11-08T07:00" });
  expect(values.audience.scope).toBe("CLASS");
  expect(values.audience.classIds).toEqual(["k7a"]);
  expect(values.audience.picked.map((card) => card.userId)).toEqual(["u9"]);
  expect(fromCampaign({ audience: { wholeTenant: true } }).audience.scope).toBe("TENANT");
  expect(fromCampaign({ audience: { gradeIds: ["7"] } }).audience).toMatchObject({ scope: "GRADE", gradeIds: ["7"] });
});
