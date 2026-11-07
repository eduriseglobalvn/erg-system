import { describe, expect, it } from "vitest";

import type { TodayView } from "../../api/timekeeping-types";
import { buildPunchChecks, minutesVsShiftLabel } from "./punch-checks";
import { NEARBY_FIX, TODAY } from "./punch-fixtures";

const base = { today: TODAY as TodayView, geo: NEARBY_FIX, geoError: null, photo: null, serverNow: new Date(2026, 10, 6, 7, 31, 5) };
const row = (id: string, rows = buildPunchChecks(base)) => rows.find((r) => r.id === id);

describe("buildPunchChecks", () => {
  it("is ok inside the radius and names the site and distance", () => {
    expect(row("location")).toMatchObject({ state: "ok", detail: "Trong bán kính 150 m · Cơ sở Cầu Giấy (38 m)" });
  });

  it("fails with the permission hint when location is denied", () => {
    const rows = buildPunchChecks({ ...base, geo: null, geoError: "denied" });
    expect(row("location", rows)).toMatchObject({ state: "fail", detail: "Bật quyền vị trí cho trình duyệt để chấm công" });
  });

  it("is pending when GPS accuracy is worse than the limit", () => {
    const rows = buildPunchChecks({ ...base, geo: { ...NEARBY_FIX, accuracyM: 180 } });
    expect(row("location", rows)).toMatchObject({ state: "pending", detail: "GPS chưa chính xác (±180 m) · lượt chấm sẽ chờ xem xét" });
  });

  it("marks the face row ok once a photo exists", () => {
    expect(row("face")?.state).toBe("pending");
    const rows = buildPunchChecks({ ...base, photo: new Blob(["x"]) });
    expect(row("face", rows)).toMatchObject({ state: "ok", detail: "Ảnh được lưu làm bằng chứng, người duyệt đối chiếu khi cần" });
  });

  it("drops both location rows on a remote day", () => {
    const rows = buildPunchChecks({ ...base, today: { ...TODAY, remote: true }, geo: null });
    expect(rows.map((r) => r.id)).toEqual(["face", "serverTime"]);
  });
});

describe("minutesVsShiftLabel", () => {
  it("words early, late and on time", () => {
    expect(minutesVsShiftLabel(-6)).toBe("Sớm 6 phút so với ca sáng");
    expect(minutesVsShiftLabel(7)).toBe("Muộn 7 phút");
    expect(minutesVsShiftLabel(0)).toBe("Đúng giờ");
  });
});
