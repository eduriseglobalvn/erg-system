import { useState, type ReactNode } from "react";
import { Bell, Download, LogOut, ShieldCheck, Smartphone, UserRound } from "lucide-react";

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
  notificationCenter,
  schoolName,
  schools,
  selectedClassId,
  selectedClassName,
  selectedSchoolId,
  teacherEmail,
  teacherName,
  unreadNotificationCount,
  onClassChange,
  onOpenNotifications,
  onNavigate,
  onSchoolChange,
  onSignOut,
}: {
  activeLabel: string;
  activeSection: TSection;
  children: ReactNode;
  classes: LmsMobileClassOption[];
  dockItems: Array<LmsMobileDockItem<TSection>>;
  notificationCenter?: ReactNode;
  schoolName: string;
  schools: LmsMobileSchoolOption[];
  selectedClassId: string;
  selectedClassName: string;
  selectedSchoolId: string;
  teacherEmail: string;
  teacherName: string;
  unreadNotificationCount?: number;
  onClassChange: (classId: string) => void;
  onOpenNotifications?: () => void;
  onNavigate: (path: string) => void;
  onSchoolChange: (schoolId: string) => void;
  onSignOut: () => void;
}) {
  const online = useOnlineStatus();
  const installPrompt = useInstallPrompt();
  const notifications = usePwaNotifications();
  const serviceWorkerUpdate = useServiceWorkerUpdate();
  const [pwaOpen, setPwaOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const shouldOfferInstall = !installPrompt.installed && (installPrompt.canInstall || installPrompt.isIos);

  function navigate(path: string) {
    setAccountOpen(false);
    onNavigate(path);
  }

  return (
    <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden bg-[#f3f6fb] text-[var(--foreground)] xl:hidden">
      <LmsMobileTopBar
        activeLabel={activeLabel}
        canInstall={installPrompt.canInstall}
        className={selectedClassName}
        installed={installPrompt.installed}
        notificationCenter={notificationCenter}
        online={online}
        schoolName={schoolName}
        teacherName={teacherName}
        unreadNotificationCount={unreadNotificationCount}
        updateAvailable={serviceWorkerUpdate.updateAvailable}
        onAccountOpen={() => setAccountOpen(true)}
        onInstall={() => setPwaOpen(true)}
        onOpenNotifications={onOpenNotifications}
        onScopeOpen={() => setScopeOpen(true)}
        onUpdate={serviceWorkerUpdate.applyUpdate}
      />

      {shouldOfferInstall ? (
        <div className="bg-[#eaf4ff] px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[16px] border border-[#c7ddf7] bg-white px-3 py-2 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
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
          Dang offline. Giao bai, lich lam viec va thong bao can ket noi mang de cap nhat an toan.
        </div>
      ) : null}

      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(104px+env(safe-area-inset-bottom,0px))]",
        )}
      >
        {children}
      </main>

      <LmsBottomDock activeSection={activeSection} items={dockItems} onNavigate={navigate} />

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
          {onOpenNotifications ? (
            <button
              type="button"
              className="flex min-h-12 items-center gap-3 rounded-[12px] border border-[var(--border)] bg-white px-3 text-left text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              onClick={() => {
                setAccountOpen(false);
                onOpenNotifications();
              }}
            >
              <Bell className="h-5 w-5 shrink-0" />
              <span className="text-sm font-extrabold">Mo thong bao</span>
            </button>
          ) : null}
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
