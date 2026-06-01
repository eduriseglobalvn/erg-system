import type { ReactNode } from "react";

import { StudentAnnouncementPopup } from "@/features/elearning/student-dashboard/components/student-announcement-popup";
import { StudentDashboardMobileShell } from "@/features/elearning/student-dashboard/components/student-dashboard-mobile-shell";
import type {
  StudentDockPageKey,
  StudentPageKey,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";

export function StudentDashboardMobileApp({
  activePage,
  announcementPopup,
  announcementUnreadCount,
  children,
  currentPageLabel,
  dockItems,
  studentName,
  onAccountOpen,
  onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementPopup: {
    announcement: StudentTeacherAnnouncement;
    autoDismissLabel: string;
    ctaLabel: string;
    dismissLabel: string;
    isOpen: boolean;
    pinnedLabel: string;
    snoozeLabel: string;
    onClose: () => void;
    onOpenDetail: (announcementId: string) => void;
    onSnooze: (announcementId: string) => void;
  } | null;
  announcementUnreadCount: number;
  children: ReactNode;
  currentPageLabel: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen: () => void;
  onAnnouncementsOpen: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  return (
    <>
      {announcementPopup ? <StudentAnnouncementPopup {...announcementPopup} /> : null}
      <StudentDashboardMobileShell
        activePage={activePage}
        announcementUnreadCount={announcementUnreadCount}
        currentPageLabel={currentPageLabel}
        dockItems={dockItems}
        studentName={studentName}
        onAccountOpen={onAccountOpen}
        onAnnouncementsOpen={onAnnouncementsOpen}
        onPageChange={onPageChange}
      >
        {children}
      </StudentDashboardMobileShell>
    </>
  );
}
