import { useMemo, useState, type ReactNode } from "react";
import { Bell, BellRing, Download, LogOut, ShieldCheck, Smartphone, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

import { LmsBottomDock, type LmsMobileDockItem } from "./lms-bottom-dock";
import { LmsMobileTopBar } from "./lms-mobile-top-bar";
import { LmsPwaSetupSheet } from "./lms-pwa-setup-sheet";
import { LmsScopeSheet, type LmsMobileClassOption, type LmsMobileSchoolOption } from "./lms-scope-sheet";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { useInstallPrompt } from "../hooks/use-install-prompt";
import { useOnlineStatus } from "../hooks/use-online-status";
import { usePwaNotifications } from "../hooks/use-pwa-notifications";
import { useServiceWorkerUpdate } from "../hooks/use-service-worker-update";

export function LmsMobileShell<TSection extends string>({
  activeLabel,
  activeSection,
  children,
  classes,
  dockItems,
  navItems,
  notificationCenter,
  schoolName,
  schools,
  selectedClassId,
  selectedClassName,
  selectedSchoolId,
  teacherEmail,
  teacherName,
  onClassChange,
  onNavigate,
  onSchoolChange,
  onSignOut,
}: {
  activeLabel: string;
  activeSection: TSection;
  children: ReactNode;
  classes: LmsMobileClassOption[];
  dockItems: Array<LmsMobileDockItem<TSection>>;
  navItems: Array<LmsMobileDockItem<TSection>>;
  notificationCenter?: ReactNode;
  schoolName: string;
  schools: LmsMobileSchoolOption[];
  selectedClassId: string;
  selectedClassName: string;
  selectedSchoolId: string;
  teacherEmail: string;
  teacherName: string;
  onClassChange: (classId: string) => void;
  onNavigate: (path: string) => void;
  onSchoolChange: (schoolId: string) => void;
  onSignOut: () => void;
}) {
  const online = useOnlineStatus();
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications();
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dockIds = useMemo(() => new Set(dockItems.map((item) => item.id)), [dockItems]);
  const moreItems = navItems.filter((item) => !dockIds.has(item.id));
  const moreActive = !dockIds.has(activeSection);
  const shouldOfferInstall = !installPrompt.installed && (installPrompt.canInstall || installPrompt.isIos);
  const shouldShowPwaNotice = shouldOfferInstall || notifications.state !== "enabled";

  function navigate(path: string) {
    setMoreOpen(false);
    setAccountOpen(false);
    onNavigate(path);
  }

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col bg-[#f3f6fb] text-[var(--foreground)] xl:hidden">
      <LmsMobileTopBar
        activeLabel={activeLabel}
        canInstall={installPrompt.canInstall}
        className={selectedClassName}
        installed={installPrompt.installed}
        notificationCenter={notificationCenter}
        online={online}
        schoolName={schoolName}
        teacherName={teacherName}
        updateAvailable={serviceWorkerUpdate.updateAvailable}
        onAccountOpen={() => setAccountOpen(true)}
        onInstall={() => setPwaOpen(true)}
        onScopeOpen={() => setScopeOpen(true)}
        onUpdate={serviceWorkerUpdate.applyUpdate}
      />

      {shouldOfferInstall ? (
        <div className="border-b border-[#dbeafe] bg-[#eef6ff] px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[14px] border border-[#c7ddf7] bg-white px-3 py-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            onClick={() => setPwaOpen(true)}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--primary)] text-white">
              <Smartphone className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-slate-950">Them LMS vao man hinh chinh</span>
              <span className="block truncate text-xs font-semibold text-slate-500">Mo nhanh nhu app, co icon va loi tat rieng.</span>
            </span>
            <Download className="h-5 w-5 shrink-0 text-[var(--primary)]" />
          </button>
        </div>
      ) : null}

      {!online ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">
          Dang offline. Du lieu diem, diem danh va giao bai can ket noi mang de cap nhat an toan.
        </div>
      ) : null}

      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto pb-[calc(92px+env(safe-area-inset-bottom,0px))]",
          "supports-[height:100dvh]:max-h-[calc(100dvh-64px)]",
        )}
      >
        {children}
      </main>

      <LmsBottomDock
        activeSection={activeSection}
        items={dockItems}
        moreActive={moreActive}
        onMoreOpen={() => setMoreOpen(true)}
        onNavigate={navigate}
      />

      <LmsScopeSheet
        classes={classes}
        open={scopeOpen}
        schools={schools}
        selectedClassId={selectedClassId}
        selectedSchoolId={selectedSchoolId}
        onClassChange={onClassChange}
        onOpenChange={setScopeOpen}
        onSchoolChange={onSchoolChange}
      />

      <MobileBottomSheet
        open={moreOpen}
        title="Them chuc nang"
        description={`${selectedClassName} · ${schoolName}`}
        onOpenChange={setMoreOpen}
      >
        <div className="grid gap-2">
          {shouldShowPwaNotice ? (
            <button
              type="button"
              className="mb-1 flex items-start gap-3 rounded-[16px] border border-[#b8d6fa] bg-[#eef6ff] p-3 text-left text-[var(--primary)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
              onClick={() => {
                setMoreOpen(false);
                setPwaOpen(true);
              }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-white text-[var(--primary)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <BellRing className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-950">Bat thong bao LMS</span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-600">{pwaNoticeText(shouldOfferInstall, notifications.state)}</span>
                <span className="mt-2 inline-flex min-h-8 items-center rounded-[10px] bg-[var(--primary)] px-3 text-xs font-extrabold text-white">
                  Cai dat ngay
                </span>
              </span>
            </button>
          ) : null}
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeSection;

            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-[12px] border px-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                  active
                    ? "border-[#b8d6fa] bg-[#eef6ff] text-[var(--primary)]"
                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                )}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-extrabold">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
            onClick={() => {
              setMoreOpen(false);
              setPwaOpen(true);
            }}
          >
            <Smartphone className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Cai app va thong bao</span>
          </button>
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Thong bao</span>
          </button>
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
            onClick={() => navigate("/account")}
          >
            <UserRound className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Tai khoan</span>
          </button>
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        open={accountOpen}
        title={teacherName}
        description={teacherEmail}
        onOpenChange={setAccountOpen}
      >
        <div className="grid gap-2">
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            onClick={() => navigate("/account")}
          >
            <UserRound className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Quan ly tai khoan</span>
          </button>
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
            onClick={() => navigate("/account/login-logs")}
          >
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Lich su dang nhap</span>
          </button>
          <button
            type="button"
            className="flex min-h-12 items-center gap-3 rounded-[12px] border border-rose-100 bg-rose-50 px-3 text-left text-rose-700 transition hover:bg-rose-100"
            onClick={onSignOut}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="text-sm font-extrabold">Dang xuat</span>
          </button>
        </div>
      </MobileBottomSheet>

      <LmsPwaSetupSheet installPrompt={installPrompt} notifications={notifications} open={pwaOpen} onOpenChange={setPwaOpen} />
    </div>
  );
}

function pwaNoticeText(shouldOfferInstall: boolean, notificationState: "unsupported" | "blocked" | "default" | "enabled" | "unconfigured") {
  if (shouldOfferInstall) {
    return "Them app vao man hinh chinh de mo nhanh va nhan thong bao lop hoc.";
  }

  if (notificationState === "blocked") {
    return "Thong bao dang bi chan. Mo cai dat de cap quyen lai.";
  }

  if (notificationState === "unconfigured") {
    return "Can cau hinh push notification truoc khi gui thong bao nen.";
  }

  if (notificationState === "unsupported") {
    return "Thiet bi nay chua ho tro thong bao nen cho PWA.";
  }

  return "Bat thong bao de khong bo lo lich day, bai tap va dong bo LMS.";
}
