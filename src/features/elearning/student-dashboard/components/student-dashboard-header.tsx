import { useState } from "react";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

import { BrandWordmark } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-ui";
import type { ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import type {
  DashboardCopy,
  DiscussionScrollTarget,
  StudentDiscussionNotification,
  StudentPageKey,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { cn } from "@/lib/utils";

export function StudentBrandHeader({
  account,
  activePage,
  announcementUnreadCount,
  copy,
  notifications,
  studentName,
  studentClass,
  onNotificationClick,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  copy: DashboardCopy;
  notifications: StudentDiscussionNotification[];
  studentName: string;
  studentClass: string;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4">
          <BrandWordmark />
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <NotificationMenu
                copy={copy}
                menuOpen={notificationMenuOpen}
                notifications={notifications}
                onMenuOpenChange={setNotificationMenuOpen}
                onNotificationClick={(target) => {
                  setNotificationMenuOpen(false);
                  onNotificationClick(target);
                }}
              />
              <ProfileMenu
                account={account}
                copy={copy}
                menuOpen={accountMenuOpen}
                studentClass={studentClass}
                studentName={studentName}
                onMenuOpenChange={setAccountMenuOpen}
                onPageChange={onPageChange}
                onSignIn={onSignIn}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
          {copy.navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "relative inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-semibold transition",
                activePage === item.key
                  ? "border-[#b8d6fa] bg-white text-[var(--erg-blue)] shadow-sm after:absolute after:inset-x-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--erg-blue)]"
                  : "text-slate-600 hover:border-[#d9e0ea] hover:bg-white hover:text-[var(--erg-blue)]",
              )}
              onClick={() => onPageChange(item.key)}
            >
              {item.icon}
              {item.label}
              {item.key === "announcements" && announcementUnreadCount > 0 ? (
                <span className="grid min-w-5 place-items-center rounded-full bg-[var(--erg-red)] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
                  {announcementUnreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex lg:items-center lg:gap-2">
          <NotificationMenu
            copy={copy}
            menuOpen={notificationMenuOpen}
            notifications={notifications}
            onMenuOpenChange={setNotificationMenuOpen}
            onNotificationClick={(target) => {
              setNotificationMenuOpen(false);
              onNotificationClick(target);
            }}
          />
          <ProfileMenu
            account={account}
            copy={copy}
            menuOpen={accountMenuOpen}
            studentClass={studentClass}
            studentName={studentName}
            onMenuOpenChange={setAccountMenuOpen}
            onPageChange={onPageChange}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}

function ProfileMenu({
  account,
  copy,
  menuOpen,
  studentClass,
  studentName,
  onMenuOpenChange,
  onPageChange,
  onSignIn,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  copy: DashboardCopy;
  menuOpen: boolean;
  studentClass: string;
  studentName: string;
  onMenuOpenChange: (open: boolean) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();
  const signedInLabel = account ? copy.signedInAs : copy.guestLabel;

  function handleAccountClick() {
    onPageChange("account");
    onMenuOpenChange(false);
  }

  function handleAuthClick() {
    onMenuOpenChange(false);
    if (account) {
      onSignOut();
      return;
    }
    onSignIn();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={menuOpen}
        className={cn(
          "flex min-w-[148px] items-center gap-2 rounded-lg border bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-[#b8d6fa] hover:bg-white",
          menuOpen ? "border-[#b8d6fa] text-[var(--erg-blue)] ring-2 ring-[var(--erg-blue-ring)]" : "border-[#cfd7e3]",
        )}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--erg-blue)] text-xs font-semibold text-white">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block max-w-[98px] truncate text-sm font-semibold leading-4 text-[var(--erg-blue)]">{studentName}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-4 text-slate-500">
            <span>{studentClass}</span>
            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
            <span className="max-w-[76px] truncate">{signedInLabel}</span>
          </span>
        </span>
        <ExpandMoreOutlinedIcon
          className={cn("shrink-0 text-slate-400 transition", menuOpen ? "rotate-180" : "rotate-0")}
          fontSize="small"
        />
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-lg border border-[#cfd7e3] bg-white shadow-sm">
          <div className="border-b border-[#edf1f5] px-4 py-3">
            <div className="text-sm font-semibold text-slate-950">{studentName}</div>
            <div className="mt-1 text-xs text-slate-500">{studentClass}</div>
          </div>

          <div className="grid gap-1 p-2">
            <button
              type="button"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]"
              onClick={handleAccountClick}
            >
              <SettingsOutlinedIcon fontSize="small" />
              {copy.accountTitle}
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-[var(--erg-blue-light)]",
                account ? "text-[var(--erg-red)]" : "text-[var(--erg-blue)]",
              )}
              onClick={handleAuthClick}
            >
              {account ? <LogoutOutlinedIcon fontSize="small" /> : <LoginOutlinedIcon fontSize="small" />}
              {account ? copy.signOut : copy.signIn}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationMenu({
  copy,
  menuOpen,
  notifications,
  onMenuOpenChange,
  onNotificationClick,
}: {
  copy: DashboardCopy;
  menuOpen: boolean;
  notifications: StudentDiscussionNotification[];
  onMenuOpenChange: (open: boolean) => void;
  onNotificationClick: (target: DiscussionScrollTarget) => void;
}) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-label={copy.notificationTitle}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-lg border bg-white text-[var(--erg-blue)] shadow-sm transition hover:border-[#b8d6fa] hover:bg-white",
          menuOpen ? "border-[#b8d6fa] ring-2 ring-[var(--erg-blue-ring)]" : "border-[#cfd7e3]",
        )}
        onClick={() => onMenuOpenChange(!menuOpen)}
      >
        <NotificationsNoneOutlinedIcon fontSize="small" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--erg-red)] px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {menuOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] overflow-hidden rounded-lg border border-[#cfd7e3] bg-white shadow-sm">
          <div className="border-b border-[#edf1f5] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--erg-blue)]">{copy.notificationTitle}</div>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left transition hover:bg-[var(--erg-blue-light)]",
                    notification.unread ? "bg-[var(--erg-blue)]/5" : "bg-white",
                  )}
                  onClick={() =>
                    onNotificationClick({
                      replyId: notification.replyId,
                      threadId: notification.threadId,
                    })
                  }
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        notification.unread ? "bg-[var(--erg-red)]" : "bg-slate-300",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold leading-5 text-slate-900">
                        {notification.primaryText}
                      </span>
                      <span className="mt-0.5 block truncate text-xs leading-5 text-slate-500">
                        {notification.secondaryText}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">{notification.timeLabel}</span>
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500">{copy.notificationEmpty}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
