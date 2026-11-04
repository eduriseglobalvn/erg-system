import { useEffect, useState } from "react";
import type { StudentTeacherAnnouncement } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { isAnnouncementPopupSnoozed } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { useDebouncedCallback } from "@/hooks/use-paced-callback";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";

/** Opens the newest teacher announcement as a toast, closes it after 30s and reopens it on focus. */
export function useAnnouncementPopup(latestAnnouncement: StudentTeacherAnnouncement | undefined, quizOpen: boolean) {
  const [announcementPopupOpen, setAnnouncementPopupOpen] = useState(false);
  const paceStateUpdate = usePacedStateBatch();
  const autoCloseAnnouncementPopup = useDebouncedCallback(() => setAnnouncementPopupOpen(false), 30000);

  useEffect(() => {
    if (quizOpen) {
      paceStateUpdate(() => setAnnouncementPopupOpen(false));
      return;
    }

    if (!latestAnnouncement) return;
    if (isAnnouncementPopupSnoozed(latestAnnouncement.id)) return;
    paceStateUpdate(() => setAnnouncementPopupOpen(true));
  }, [latestAnnouncement, paceStateUpdate, quizOpen]);

  useEffect(() => {
    if (!announcementPopupOpen) {
      autoCloseAnnouncementPopup.cancel();
      return;
    }

    autoCloseAnnouncementPopup.run();
    return () => autoCloseAnnouncementPopup.cancel();
  }, [announcementPopupOpen, autoCloseAnnouncementPopup]);

  useEffect(() => {
    function reopenAnnouncementPopup() {
      if (quizOpen) return;
      if (!latestAnnouncement) return;
      if (document.visibilityState !== "visible") return;
      if (isAnnouncementPopupSnoozed(latestAnnouncement.id)) return;
      setAnnouncementPopupOpen(true);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        reopenAnnouncementPopup();
      }
    }

    window.addEventListener("focus", reopenAnnouncementPopup);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", reopenAnnouncementPopup);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [latestAnnouncement, quizOpen]);

  return { announcementPopupOpen, setAnnouncementPopupOpen };
}
