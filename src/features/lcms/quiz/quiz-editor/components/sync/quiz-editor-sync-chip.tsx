import Stack from "@mui/material/Stack";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatTimeVi } from "@/domain/formatters/format-date";

import type { QuizDraftSyncStatus } from "../../sync/quiz-draft-sync-engine";

type ChipView = { label: string; tone: "success" | "warning" | "error" | "info" | "neutral" };

function describe(status: QuizDraftSyncStatus): ChipView {
  switch (status.kind) {
    case "saved": {
      const time = formatTimeVi(status.at);
      return { label: time ? `Đã lưu lên máy chủ · ${time}` : "Đã lưu lên máy chủ", tone: "success" };
    }
    case "pending":
    case "saving":
      return { label: "Đang lưu…", tone: "info" };
    case "offline":
      return {
        label: status.pendingEdits > 0 ? `Ngoại tuyến · ${status.pendingEdits} thay đổi chờ gửi` : "Ngoại tuyến",
        tone: "warning",
      };
    case "signed-out":
      return { label: "Chờ đăng nhập lại để gửi", tone: "warning" };
    case "conflict":
      return { label: "Cần chọn bản để giữ", tone: "error" };
    case "storage-full":
      return { label: "Bộ nhớ máy đầy, chưa lưu được trên máy", tone: "error" };
    case "error":
      return { label: "Lưu thất bại · Thử lại", tone: "error" };
    case "loading":
      return { label: "Đang mở bản nháp…", tone: "neutral" };
  }
}

export function QuizEditorSyncChip({ onRetry, persistent, status }: {
  status: QuizDraftSyncStatus;
  persistent: boolean;
  onRetry: () => void;
}) {
  const { label, tone } = describe(status);
  return (
    <Stack direction="row" spacing={1}>
      <ErgStatusChip label={label} onClick={status.kind === "error" ? onRetry : undefined} tone={tone} />
      {persistent ? null : <ErgStatusChip label="Chỉ lưu tạm trên tab này" tone="neutral" />}
    </Stack>
  );
}
