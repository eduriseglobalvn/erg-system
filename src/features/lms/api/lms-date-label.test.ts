import { describe, expect, it } from "vitest";

import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";
import { formatDueLabel } from "@/features/lms/api/lms-teacher-homework-api";
import { formatDateLabel } from "@/features/lms/api/lms-classroom-api";
import { formatProgressTimestamp } from "@/features/lms/components/homework-progress-page";

describe("LMS date labels", () => {
  it("formats dd/MM HH:mm in local time", () => {
    expect(formatShortDateTimeVi(new Date(2026, 9, 25, 19, 24))).toBe("25/10 19:24");
  });

  it.each([null, undefined, "", "not-a-date"])("never returns Invalid Date for %p", (value) => {
    expect(formatShortDateTimeVi(value)).toBe("");
    expect(formatDueLabel(value)).toBe("Chưa có hạn nộp");
    expect(formatDateLabel(String(value ?? ""))).toBe("Mới cập nhật");
    expect(formatProgressTimestamp(value)).toBe("—");
  });

  it("prefixes the due label for valid dates", () => {
    expect(formatDueLabel(new Date(2026, 4, 28, 10, 50).toISOString())).toBe("Hạn nộp 28/05 10:50");
  });
});
