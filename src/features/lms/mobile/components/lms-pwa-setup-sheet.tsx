import { AlertCircle, BellRing, CheckCircle2, Download, MoreVertical, Share, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

import { MobileBottomSheet } from "./mobile-bottom-sheet";

type InstallPromptState = {
  canInstall: boolean;
  installed: boolean;
  isIos: boolean;
  isManualInstall: boolean;
  platform: "android" | "ios" | "desktop" | "unknown";
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

type NotificationSetupState = {
  busy: boolean;
  enableNotifications: () => Promise<"granted" | "denied" | "default" | "failed" | "unconfigured" | "unsupported">;
  error: string | null;
  state: "unsupported" | "blocked" | "default" | "enabled" | "unconfigured";
};

export function LmsPwaSetupSheet({
  installPrompt,
  notifications,
  open,
  onOpenChange,
}: {
  installPrompt: InstallPromptState;
  notifications: NotificationSetupState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const installReady = installPrompt.canInstall && !installPrompt.installed;
  const androidInstall = installPrompt.platform === "android";
  const manualInstall = installPrompt.isManualInstall;

  return (
    <MobileBottomSheet open={open} title="Cai LMS tren dien thoai" description="Mo nhanh nhu app va nhan thong bao lop hoc." onOpenChange={onOpenChange}>
      <div className="grid gap-3">
        <section className="rounded-[16px] border border-[#dbeafe] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#eef6ff] text-[var(--primary)]">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-slate-950">Them vao man hinh chinh</div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                LMS se mo bang cua so rieng, co icon ERG va cac loi tat nhanh cho Bai tap, Diem danh, Bang diem, Lich day.
              </p>
            </div>
          </div>

          {installPrompt.installed ? (
            <StatusLine tone="success" icon={CheckCircle2} label="Da cai tren thiet bi nay." />
          ) : installReady ? (
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary)] px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(15,108,189,0.22)]"
                onClick={() => void installPrompt.promptInstall()}
              >
                <Download className="h-5 w-5" />
                Them vao man hinh chinh
              </button>
              {androidInstall ? (
                <div className="grid gap-2">
                  <InstructionStep icon={Download} text="Bam nut tren de cai nhanh bang Chrome." />
                  <InstructionStep icon={MoreVertical} text="Neu khong hien bang cai dat, mo menu ba cham cua Chrome." />
                  <InstructionStep icon={Smartphone} text="Chon Install app hoac Add to Home screen." />
                </div>
              ) : null}
            </div>
          ) : manualInstall ? (
            <div className="mt-4 grid gap-2">
              <InstructionStep icon={Share} text="Bam nut Share cua Safari." />
              <InstructionStep icon={Download} text="Chon Add to Home Screen." />
              <InstructionStep icon={CheckCircle2} text="Bam Add de tao icon ERG LMS." />
            </div>
          ) : androidInstall ? (
            <div className="mt-4 grid gap-2">
              <InstructionStep icon={MoreVertical} text="Mo Chrome menu ba cham o goc tren." />
              <InstructionStep icon={Download} text="Chon Install app hoac Add to Home screen." />
              <InstructionStep icon={CheckCircle2} text="Xac nhan Install de tao icon ERG LMS." />
            </div>
          ) : (
            <StatusLine tone="warning" icon={AlertCircle} label="Trinh duyet se hien nut cai khi PWA du dieu kien va chua duoc cai." />
          )}
        </section>

        <section className="rounded-[16px] border border-[#e5edf7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#ecfdf5] text-emerald-700">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-slate-950">Thong bao nen</div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Cho phep nhan thong bao lich day, bai tap va dong bo ngay ca khi LMS khong mo tren man hinh.
              </p>
            </div>
          </div>

          <NotificationStatus notifications={notifications} />
        </section>

        <section className="rounded-[16px] border border-[#e5edf7] bg-[#fbfdff] p-4">
          <div className="flex items-start gap-3 text-xs font-semibold leading-5 text-slate-600">
            <MoreVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>
              Tren Chrome Android, cac loi tat trong manifest se nam trong menu khi nhan giu icon ERG LMS. Tren iPhone, iOS chi cho them app icon thu
              cong tu Safari.
            </p>
          </div>
        </section>
      </div>
    </MobileBottomSheet>
  );
}

function NotificationStatus({ notifications }: { notifications: NotificationSetupState }) {
  if (notifications.state === "enabled") {
    return <StatusLine tone="success" icon={CheckCircle2} label="Da bat thong bao tren thiet bi nay." />;
  }

  if (notifications.state === "blocked") {
    return <StatusLine tone="danger" icon={AlertCircle} label="Trinh duyet dang chan thong bao. Hay mo Settings cua site de cap quyen lai." />;
  }

  if (notifications.state === "unsupported") {
    return <StatusLine tone="warning" icon={AlertCircle} label="Trinh duyet nay chua ho tro Web Push cho PWA." />;
  }

  if (notifications.state === "unconfigured") {
    return <StatusLine tone="warning" icon={AlertCircle} label="Can cau hinh VITE_WEB_PUSH_PUBLIC_KEY va backend push subscription." />;
  }

  return (
    <>
      <button
        type="button"
        disabled={notifications.busy}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-[#b8d6fa] bg-[#eef6ff] px-4 text-sm font-extrabold text-[var(--primary)] disabled:opacity-60"
        onClick={() => void notifications.enableNotifications()}
      >
        <BellRing className="h-5 w-5" />
        {notifications.busy ? "Dang bat thong bao..." : "Bat thong bao"}
      </button>
      {notifications.error ? <p className="mt-2 text-xs font-semibold leading-5 text-rose-700">{notifications.error}</p> : null}
    </>
  );
}

function InstructionStep({ icon: Icon, text }: { icon: typeof Share; text: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-[12px] border border-[#e5edf7] bg-[#f8fbff] px-3 text-sm font-bold text-slate-700">
      <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
      <span>{text}</span>
    </div>
  );
}

function StatusLine({ icon: Icon, label, tone }: { icon: typeof CheckCircle2; label: string; tone: "success" | "warning" | "danger" }) {
  return (
    <div
      className={cn(
        "mt-4 flex min-h-11 items-center gap-2 rounded-[12px] border px-3 text-xs font-extrabold leading-5",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
