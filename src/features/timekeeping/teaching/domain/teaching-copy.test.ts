import { describe, expect, it } from "vitest";

import { closeStatusText, confirmationText, myBanner } from "./teaching-copy";

describe("teaching-copy", () => {
  it("words the waiting banner shorter on the phone", () => {
    const data = { deadline: "2026-11-16" };
    expect(myBanner("AWAITING", data, "2026-10", false).title).toBe("Bảng công tháng 10 đang chờ bạn xác nhận · hạn 16/11");
    expect(myBanner("AWAITING", data, "2026-10", true)).toMatchObject({ tone: "notice", title: "Chờ bạn xác nhận · hạn 16/11" });
  });

  it("turns green once confirmed or closed", () => {
    expect(myBanner("CONFIRMED", {}, "2026-10", false).tone).toBe("ok");
    expect(myBanner("CLOSED", { closedAt: "2026-11-03T02:00:00Z" }, "2026-10", true)).toMatchObject({ tone: "ok", title: "Đã chốt · 03/11" });
    expect(myBanner("COLLECTING", {}, "2026-10", false).tone).toBe("info");
  });

  it("says how many teachers are still to confirm", () => {
    expect(closeStatusText("COLLECTING", false, 0, 3)).toBe("Tháng chưa kết thúc · đang thu thập số tiết");
    expect(closeStatusText("COLLECTING", true, 1, 3)).toBe("Đã xác nhận 1/3 · còn 2 chờ GV");
    expect(closeStatusText("READY", true, 3, 3)).toBe("GV đã xác nhận đủ · sẵn sàng chốt");
    expect(closeStatusText("CLOSED", true, 3, 3, "2026-10-02T03:00:00Z")).toBe("Đã chốt 02/10/2026");
  });

  it("tones the confirmation pill", () => {
    expect(confirmationText("CONFIRMED", "2026-11-16T03:00:00Z")).toEqual({ label: "Đã xác nhận 16/11", tone: "success" });
    expect(confirmationText("PENDING", undefined)).toEqual({ label: "Chờ GV", tone: "warning" });
    expect(confirmationText("ISSUE_REPORTED", undefined).tone).toBe("error");
  });
});
