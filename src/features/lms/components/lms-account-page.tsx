import { useState } from "react";
import { CalendarClock, KeyRound, LogOut, Mail, Phone, ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, Button, Input } from "@/components/ui/dashboard-kit";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { cn } from "@/lib/utils";

type AccountDialog = "email" | "password" | "phone" | "mfa" | null;

const permissionLabels = ["Lớp học", "Bài tập", "Bảng điểm", "Điểm danh", "Tài nguyên", "Báo cáo"];

export function LmsAccountPage({
  onLoginLogs,
  onSignedOut,
}: {
  onLoginLogs: () => void;
  onSignedOut: () => void;
}) {
  const auth = useAuthSession("lms");
  const account = auth.account;
  const [activeDialog, setActiveDialog] = useState<AccountDialog>(null);
  const [secondaryEmailDraft, setSecondaryEmailDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState(account?.phone || "0909 888 666");
  const displayName = account?.fullName || "ERG Super Admin";
  const email = account?.email || "admin@erg.edu.vn";
  const role = account?.title || account?.role || "Quản trị viên";
  const status = account?.status || "ACTIVE";
  const accountId = account?.id || "usr_super_admin";

  function signOut() {
    auth.actions.signOut();
    logoutAccount();
    onSignedOut();
  }

  return (
    <section className="min-h-full bg-[#f7f8fa] px-3 py-3 text-slate-950 xl:px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <section className="rounded-lg border border-[#e0e4ea] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-4 px-5 py-5">
            <Avatar size="lg" className="size-12 overflow-visible rounded-lg bg-[var(--erg-blue)] ring-2 ring-[var(--erg-blue-ring)]">
              <AvatarImage src={account?.avatarUrl} alt={displayName} />
              <AvatarFallback className="rounded-lg bg-[var(--erg-blue)] text-base font-semibold text-white">
                {initials(displayName)}
              </AvatarFallback>
              <AvatarBadge className="size-4 border border-white bg-emerald-500 ring-2 ring-white" />
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold leading-tight text-[#242424]">{displayName}</h1>
                <Badge tone="success" className="tracking-normal">
                  {status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">{email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onLoginLogs}>
                <CalendarClock data-icon="inline-start" />
                Lịch sử đăng nhập
              </Button>
              <Button variant="danger" onClick={signOut}>
                <LogOut data-icon="inline-start" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 xl:grid-cols-[1fr_380px]">
          <section className="rounded-lg border border-[#e0e4ea] bg-white shadow-sm">
            <SectionHeader
              title="Thông tin tài khoản"
              description="Thông tin định danh và liên hệ dùng khi giáo viên thao tác trên LMS."
            />
            <div className="grid gap-px bg-slate-100 md:grid-cols-2">
              <InfoRow label="Họ tên" value={displayName} icon={UserRound} />
              <InfoRow label="Mã tài khoản" value={accountId} />
              <InfoRow label="Email chính" value={email} icon={Mail} />
              <InfoRow
                label="Email phụ"
                value={secondaryEmailDraft || "Chưa thêm"}
                icon={Mail}
                actionLabel={secondaryEmailDraft ? "Cập nhật" : "Thêm email phụ"}
                onAction={() => setActiveDialog("email")}
              />
              <InfoRow label="Số điện thoại" value={phoneDraft} icon={Phone} actionLabel="Cập nhật" onAction={() => setActiveDialog("phone")} />
              <InfoRow label="Vai trò" value={role} icon={ShieldCheck} />
            </div>
          </section>

          <section className="rounded-lg border border-[#e0e4ea] bg-white shadow-sm">
            <SectionHeader title="Bảo mật" description="Các thiết lập quan trọng cho đăng nhập và xác minh." compact />
            <div className="divide-y divide-slate-100">
              <SecurityRow
                icon={KeyRound}
                title="Mật khẩu"
                detail="Đã đặt mật khẩu đăng nhập."
                actionLabel="Đổi"
                onAction={() => setActiveDialog("password")}
                tone="info"
              />
              <SecurityRow
                icon={Mail}
                title="Email xác minh"
                detail="Email chính đã xác thực. Chỉ cho phép thêm email phụ."
                actionLabel="Thêm phụ"
                onAction={() => setActiveDialog("email")}
                tone="success"
              />
              <SecurityRow
                icon={Smartphone}
                title="Xác thực 2 lớp"
                detail="Chưa bật OTP cho thiết bị mới."
                actionLabel="Bật"
                onAction={() => setActiveDialog("mfa")}
                tone="warning"
              />
              <SecurityRow
                icon={CalendarClock}
                title="Thiết bị đăng nhập"
                detail="Theo dõi IP, vị trí, trình duyệt."
                actionLabel="Xem"
                onAction={onLoginLogs}
                tone="neutral"
              />
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-[#e0e4ea] bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Quyền truy cập LMS</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">Các phạm vi đang được cấp cho tài khoản này.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {permissionLabels.map((label) => (
                <span key={label} className="rounded-md border border-[#b8d6fa] bg-[#ebf3fc] px-3 py-1 text-xs font-semibold text-[#0f5ea8]">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <AccountActionDialog
        activeDialog={activeDialog}
        primaryEmail={email}
        secondaryEmailDraft={secondaryEmailDraft}
        phoneDraft={phoneDraft}
        setActiveDialog={setActiveDialog}
        setSecondaryEmailDraft={setSecondaryEmailDraft}
        setPhoneDraft={setPhoneDraft}
      />
    </section>
  );
}

function SectionHeader({ compact, description, title }: { compact?: boolean; description: string; title: string }) {
  return (
    <div className={cn("border-b border-slate-100 px-5", compact ? "py-4" : "py-4")}>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{description}</p>
    </div>
  );
}

function InfoRow({
  actionLabel,
  icon: Icon,
  label,
  onAction,
  value,
}: {
  actionLabel?: string;
  icon?: typeof UserRound;
  label: string;
  onAction?: () => void;
  value?: string | null;
}) {
  return (
    <div className="min-h-20 bg-white px-5 py-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value || "-"}</div>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-2 text-xs font-semibold text-[var(--erg-blue)] hover:underline">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function SecurityRow({
  actionLabel,
  detail,
  icon: Icon,
  onAction,
  title,
  tone,
}: {
  actionLabel: string;
  detail: string;
  icon: typeof ShieldCheck;
  onAction: () => void;
  title: string;
  tone: "success" | "info" | "warning" | "neutral";
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          tone === "success" && "bg-emerald-50 text-emerald-600",
          tone === "info" && "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
          tone === "warning" && "bg-amber-50 text-amber-600",
          tone === "neutral" && "bg-slate-100 text-slate-600",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">{detail}</span>
      </span>
      <Button variant="outline" className="h-8 rounded-md px-3 text-xs" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function AccountActionDialog({
  activeDialog,
  primaryEmail,
  secondaryEmailDraft,
  phoneDraft,
  setActiveDialog,
  setSecondaryEmailDraft,
  setPhoneDraft,
}: {
  activeDialog: AccountDialog;
  primaryEmail: string;
  secondaryEmailDraft: string;
  phoneDraft: string;
  setActiveDialog: (dialog: AccountDialog) => void;
  setSecondaryEmailDraft: (value: string) => void;
  setPhoneDraft: (value: string) => void;
}) {
  const title =
    activeDialog === "email"
      ? "Thêm email phụ"
      : activeDialog === "password"
        ? "Đổi mật khẩu"
        : activeDialog === "phone"
          ? "Cập nhật số điện thoại"
          : "Bật xác thực 2 lớp";

  return (
    <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && setActiveDialog(null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{getDialogDescription(activeDialog, primaryEmail)}</DialogDescription>
        </DialogHeader>

        {activeDialog === "email" ? (
          <div className="grid gap-3">
            <Input value={secondaryEmailDraft} onChange={(event) => setSecondaryEmailDraft(event.target.value)} placeholder="Email phụ" />
            <Input placeholder="Mã xác minh gửi về email chính" />
          </div>
        ) : null}

        {activeDialog === "password" ? (
          <div className="grid gap-3">
            <Input type="password" placeholder="Mật khẩu hiện tại" />
            <Input type="password" placeholder="Mật khẩu mới" />
            <Input type="password" placeholder="Nhập lại mật khẩu mới" />
          </div>
        ) : null}

        {activeDialog === "phone" ? (
          <div className="grid gap-3">
            <Input value={phoneDraft} onChange={(event) => setPhoneDraft(event.target.value)} placeholder="Số điện thoại" />
            <Input placeholder="Mã xác minh gửi về email chính" />
          </div>
        ) : null}

        {activeDialog === "mfa" ? (
          <div className="rounded-md border border-[#b8d6fa] bg-[var(--erg-blue-light)] p-4 text-sm leading-6 text-slate-600">
            Khi bật 2FA, thiết bị mới sẽ cần thêm mã xác minh qua email hoặc ứng dụng OTP.
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
          <Button onClick={() => setActiveDialog(null)}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDialogDescription(activeDialog: AccountDialog, primaryEmail: string) {
  if (activeDialog === "email") {
    return `Email chính ${primaryEmail} không thể thay đổi. Mã xác minh sẽ được gửi về email chính để thêm email phụ.`;
  }

  if (activeDialog === "phone") {
    return `Nhập số điện thoại mới. Mã xác minh sẽ được gửi về email chính ${primaryEmail}.`;
  }

  return "Nhập thông tin mới và mã xác minh để cập nhật tài khoản.";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
