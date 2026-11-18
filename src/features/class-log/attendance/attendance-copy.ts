import { ApiClientError } from "@/lib/api-client/errors";

import type { AttendanceMark } from "./attendance-model";

export const attendanceCopy = {
  commentPlaceholder: "Nhận xét tiết học…",
  empty: "Bạn không có tiết nào theo thời khoá biểu trong ngày này. Đổi ngày ở ô phía trên để mở tiết khác.",
  loadError: "Không tải được dữ liệu.",
  noCurriculum: "Chưa có trong KCT",
  offlinePending: "Offline · chờ đồng bộ",
  railNote: "Chỉ hiện tiết có trong thời khoá biểu của bạn.",
  save: "Lưu điểm danh & ghi sổ",
  shortcuts: "Phím tắt: 1 Có mặt · 2 Muộn · 3 Vắng K · 4 Vắng P",
  subtitle: "Theo từng tiết trong thời khoá biểu · lưu xong tự ghi cột «Học sinh vắng» của sổ đầu bài",
  title: "Điểm danh",
} as const;

export const markLabels: Record<AttendanceMark, string> = {
  absentExcused: "Vắng P",
  absentUnexcused: "Vắng K",
  late: "Muộn",
  present: "Có mặt",
};

const ERROR_MESSAGES: Record<string, string> = {
  ACTUAL_PERIOD_OUT_OF_RANGE: "Tiết thực tế vượt quá khung chương trình.",
  MONTH_CLOSED: "Tháng đã chốt, không sửa được.",
  PERIOD_NOT_HAPPENED: "Tiết này chưa diễn ra nên chưa điểm danh được.",
  NOT_TEACHER_OF_PERIOD: "Bạn không phải giáo viên của tiết này.",
  STALE_VERSION: "Dữ liệu vừa được người khác sửa, đã tải lại.",
};

/** `extensions.code` of the first GraphQL error, else the client error code. */
export function attendanceErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  if (Array.isArray(error.details)) {
    for (const item of error.details as Array<{ extensions?: { code?: unknown } }>) {
      const code = item?.extensions?.code;
      if (typeof code === "string") return code;
    }
  }
  return error.code;
}

export function attendanceErrorMessage(error: unknown): string {
  const code = attendanceErrorCode(error);
  return (code && ERROR_MESSAGES[code]) || "Chưa lưu được điểm danh. Thử lại sau.";
}

/** Desktop count pill: only the first letter drops to lower case ("Vắng K" -> "vắng K"), as on the board. */
export const countLabel = (label: string) => label.replace(/^./u, (c) => c.toLocaleLowerCase("vi"));
