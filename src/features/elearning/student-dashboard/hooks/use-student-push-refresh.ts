import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { studentDashboardQueryKeys } from "@/features/elearning/student-dashboard/api/student-dashboard-query";

/** A push to the student (new assignment, announcement…) reloads the dashboard instead of waiting for focus or staleTime. */
export function useStudentPushRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // public/pwa-push.js posts every push it shows to the open tabs.
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "erg:notification-push") return;
      const portal = event.data.payload?.portal;
      if (typeof portal !== "string" || portal.toLowerCase() !== "elearning") return;
      void queryClient.invalidateQueries({ queryKey: studentDashboardQueryKeys.root });
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [queryClient]);
}
