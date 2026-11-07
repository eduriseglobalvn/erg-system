import { formatTimeVi } from "@/domain/formatters/format-date";
import type { RecentPunch } from "../api/timekeeping-types";

type Status = NonNullable<RecentPunch["status"]>;

export const PUNCH_STATUS: Record<Status, { label: string; tone: "success" | "warning" | "info" | "error" }> = {
  VALID: { label: "Hợp lệ", tone: "success" },
  FLAGGED: { label: "Cần xem", tone: "warning" },
  PENDING_REVIEW: { label: "Chờ duyệt", tone: "info" },
  REJECTED: { label: "Từ chối", tone: "error" },
};

/** "Xác thực" column: how the punch was proven. Text, so it is readable without colour. */
export const verifyText = (punch: RecentPunch) => `${punch.remote ? "Từ xa" : "GPS"}${punch.hasPhoto ? " · Ảnh" : ""}`;

/** "07:12 · Vào" */
export const punchTimeText = (punch: RecentPunch) => `${formatTimeVi(punch.time)} · ${punch.direction === "OUT" ? "Ra" : "Vào"}`;
