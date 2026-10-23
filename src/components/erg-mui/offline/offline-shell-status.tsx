import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import type { ReactNode } from "react";

import { useOfflineShellStatus } from "@/hooks/use-offline-shell-status";
import type { NetworkStateSnapshot } from "@/lib/network-quality";

export type OfflineShellQueueCounts = {
  conflictCount?: number;
  failedCount?: number;
  pendingCount?: number;
};

export type OfflineShellStatusProps = OfflineShellQueueCounts & {
  children?: ReactNode;
  network?: NetworkStateSnapshot;
};

export function OfflineShellStatus({ conflictCount = 0, failedCount = 0, network, pendingCount = 0 }: OfflineShellStatusProps) {
  const observedNetwork = useOfflineShellStatus({
    conflictCount,
    failedCount,
    pendingCount,
    trackTelemetry: !network,
  });
  const snapshot = network ?? observedNetwork;
  const copy = resolveOfflineShellStatusCopy(snapshot, { conflictCount, failedCount, pendingCount });
  if (!copy) return null;

  return (
    <Alert
      aria-live="polite"
      role="status"
      severity={copy.severity}
      sx={{ borderRadius: 0, fontSize: 12, fontWeight: 700, py: 0.25 }}
    >
      <AlertTitle sx={{ fontSize: 12, fontWeight: 800, mb: 0 }}>{copy.title}</AlertTitle>
      {copy.description}
    </Alert>
  );
}

export function resolveOfflineShellStatusCopy(
  network: NetworkStateSnapshot,
  counts: OfflineShellQueueCounts = {},
) {
  const pendingCount = boundedCount(counts.pendingCount);
  const conflictCount = boundedCount(counts.conflictCount);
  const failedCount = boundedCount(counts.failedCount);
  if (!network.online) {
    return {
      description: pendingCount || conflictCount
        ? `${pendingCount} thay đổi chưa đồng bộ${conflictCount ? ` · ${conflictCount} xung đột cần xử lý` : ""}.`
        : "Các thao tác cần máy chủ sẽ chờ đến khi có kết nối.",
      severity: "warning" as const,
      title: "Bạn đang offline",
    };
  }
  if (conflictCount) {
    return {
      description: `${conflictCount} xung đột cần được kiểm tra trước khi tiếp tục.`,
      severity: "error" as const,
      title: "Có xung đột đồng bộ",
    };
  }
  if (failedCount) {
    return {
      description: `${failedCount} thao tác không thể đồng bộ tự động; hãy thử lại hoặc loại bỏ.`,
      severity: "error" as const,
      title: "Đồng bộ chưa hoàn tất",
    };
  }
  if (pendingCount) {
    return {
      description: `${pendingCount} thay đổi đang chờ máy chủ xác nhận.`,
      severity: "info" as const,
      title: "Đang đồng bộ",
    };
  }
  if (network.quality === "degraded") {
    return {
      description: "Kết nối chậm; nội dung không thiết yếu sẽ được giảm tải.",
      severity: "info" as const,
      title: "Kết nối không ổn định",
    };
  }
  return null;
}

function boundedCount(value?: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(500, Math.max(0, Math.floor(value as number)));
}
