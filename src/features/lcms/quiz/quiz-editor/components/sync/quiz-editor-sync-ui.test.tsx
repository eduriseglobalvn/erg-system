import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { formatDateTimeVi } from "@/domain/formatters/format-date";

import type { DeviceDraftBackup } from "../../sync/quiz-draft-device-store";
import type { UseQuizDraftSyncResult } from "../../sync/use-quiz-draft-sync";
import type { QuizDraftSyncStatus } from "../../sync/quiz-draft-sync-engine";
import { QuizEditorConflictDialog } from "./quiz-editor-conflict-dialog";
import { QuizEditorOfflineBanner } from "./quiz-editor-offline-banner";
import { QuizEditorRecoveryNotice } from "./quiz-editor-recovery-notice";
import { QuizEditorSyncChip } from "./quiz-editor-sync-chip";
import { QuizEditorSyncLayer, QuizEditorSyncNotices } from "./quiz-editor-sync-layer";

const at = new Date(2026, 10, 5, 14, 7).toISOString();

describe("QuizEditorSyncChip", () => {
  const cases: [QuizDraftSyncStatus, string][] = [
    [{ kind: "saved", at }, "Đã lưu lên máy chủ · 14:07"],
    [{ kind: "saved", at: null }, "Đã lưu lên máy chủ"],
    [{ kind: "pending" }, "Đang lưu…"],
    [{ kind: "saving" }, "Đang lưu…"],
    [{ kind: "offline", pendingEdits: 2 }, "Ngoại tuyến · 2 thay đổi chờ gửi"],
    [{ kind: "offline", pendingEdits: 0 }, "Ngoại tuyến"],
    [{ kind: "signed-out" }, "Chờ đăng nhập lại để gửi"],
    [{ kind: "conflict" }, "Cần chọn bản để giữ"],
    [{ kind: "storage-full" }, "Bộ nhớ máy đầy, chưa lưu được trên máy"],
    [{ kind: "error", message: "x" }, "Lưu thất bại · Thử lại"],
    [{ kind: "loading" }, "Đang mở bản nháp…"],
  ];
  it.each(cases)("renders %j", (status, text) => {
    render(<QuizEditorSyncChip onRetry={vi.fn()} persistent status={status} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("retries on click of the error chip", () => {
    const onRetry = vi.fn();
    render(<QuizEditorSyncChip onRetry={onRetry} persistent status={{ kind: "error", message: "x" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Lưu thất bại · Thử lại" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("flags non-persistent storage", () => {
    render(<QuizEditorSyncChip onRetry={vi.fn()} persistent={false} status={{ kind: "pending" }} />);
    expect(screen.getByText("Chỉ lưu tạm trên tab này")).toBeInTheDocument();
  });
});

describe("QuizEditorOfflineBanner", () => {
  it("shows only when offline", () => {
    const { rerender } = render(<QuizEditorOfflineBanner status={{ kind: "pending" }} />);
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<QuizEditorOfflineBanner status={{ kind: "offline", pendingEdits: 1 }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Mất kết nối. Bạn vẫn soạn bình thường");
  });
});

describe("QuizEditorConflictDialog", () => {
  it("calls the right callbacks and ignores Escape", () => {
    const onKeepMine = vi.fn();
    const onUseServer = vi.fn();
    render(<QuizEditorConflictDialog busy={false} onKeepMine={onKeepMine} onUseServer={onUseServer} open />);
    expect(screen.getByText("Bài này vừa được lưu từ một máy khác")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Giữ bản của tôi" }));
    fireEvent.click(screen.getByRole("button", { name: "Dùng bản trên máy chủ" }));
    expect(onKeepMine).toHaveBeenCalledOnce();
    expect(onUseServer).toHaveBeenCalledOnce();
  });
});

const none = { recovered: false, backups: false };

describe("QuizEditorRecoveryNotice", () => {
  const backup = (createdAt: string) => ({ createdAt }) as DeviceDraftBackup;

  it("renders nothing when empty", () => {
    const { container } = render(<QuizEditorRecoveryNotice dismissed={none} onDismiss={vi.fn()} backups={[]} onRestore={vi.fn()} recovered={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the recovered line", () => {
    render(<QuizEditorRecoveryNotice dismissed={none} onDismiss={vi.fn()} backups={[]} onRestore={vi.fn()} recovered={{ editedAt: at, pendingEdits: 3 }} />);
    expect(screen.getByText("Có 3 thay đổi từ 14:07 chưa gửi. Đang gửi lên máy chủ.")).toBeInTheDocument();
  });

  it("restores the only backup directly", () => {
    const onRestore = vi.fn();
    render(<QuizEditorRecoveryNotice dismissed={none} onDismiss={vi.fn()} backups={[backup("2026-11-05T01:00:00.000Z")]} onRestore={onRestore} recovered={null} />);
    expect(screen.getByText("Có 1 bản sao của bài này trên máy.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục bản sao" }));
    expect(onRestore).toHaveBeenCalledWith("2026-11-05T01:00:00.000Z");
  });

  it("lists several backups newest first", () => {
    const onRestore = vi.fn();
    const older = "2026-11-05T01:00:00.000Z";
    const newer = "2026-11-05T03:00:00.000Z";
    render(<QuizEditorRecoveryNotice dismissed={none} onDismiss={vi.fn()} backups={[backup(older), backup(newer)]} onRestore={onRestore} recovered={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Khôi phục bản sao" }));
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveTextContent(formatDateTimeVi(newer));
    fireEvent.click(items[0]);
    expect(onRestore).toHaveBeenCalledWith(newer);
  });

  it("hides a dismissed line and reports the dismissal", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <QuizEditorRecoveryNotice backups={[]} dismissed={none} onDismiss={onDismiss} onRestore={vi.fn()} recovered={{ editedAt: at, pendingEdits: 3 }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /close|đóng/i }));
    expect(onDismiss).toHaveBeenCalledWith("recovered");
    rerender(
      <QuizEditorRecoveryNotice backups={[]} dismissed={{ ...none, recovered: true }} onDismiss={onDismiss} onRestore={vi.fn()} recovered={{ editedAt: at, pendingEdits: 3 }} />,
    );
    expect(screen.queryByText(/chưa gửi/)).toBeNull();
  });
});

describe("QuizEditorSyncLayer dismissals", () => {
  const sync = (quizId: string) =>
    ({
      backups: [], quizId, ready: true, recovered: { editedAt: at, pendingEdits: 3 }, restoreBackup: vi.fn(),
      status: { kind: "saved", at: null },
    }) as unknown as UseQuizDraftSyncResult;
  const tree = (quizId: string) => {
    const s = sync(quizId);
    return (
      <QuizEditorSyncLayer loadFailed={false} onRetry={vi.fn()} retrying={false} sync={s}>
        <QuizEditorSyncNotices sync={s} />
      </QuizEditorSyncLayer>
    );
  };

  it("dismissing in one mount hides every mount of that quiz only", () => {
    const { rerender } = render(tree("a"));
    expect(screen.getAllByText(/chưa gửi/)).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /close|đóng/i })[0]);
    expect(screen.queryByText(/chưa gửi/)).toBeNull();
    rerender(tree("b"));
    expect(screen.getAllByText(/chưa gửi/)).toHaveLength(2);
  });
});
