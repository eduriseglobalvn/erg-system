import { lazy, Suspense } from "react";

import { HackThemeProvider } from "@/features/games/hack/hack-theme";
import { HostRoom } from "@/features/games/teacher/host-room";

// Dev-only visual preview with fixed states (no socket): /teacher/games/preview?screen=live. Dropped from production builds.
const PreviewTeacher = import.meta.env.DEV ? lazy(() => import("@/features/games/teacher/dev/preview-teacher")) : null;

/** /teacher/games/$roomId: lobby, projector and final ranking of one room (full screen, no portal shell). */
export function TeacherGameRoomPage({ roomId }: { roomId: string }) {
  // The preview picks its own theme per screen (the picker, settings and list are the normal LMS look).
  if (PreviewTeacher && roomId === "preview") return <Suspense fallback={null}><PreviewTeacher /></Suspense>;
  return (
    <HackThemeProvider>
      <HostRoom key={roomId} roomId={roomId} />
    </HackThemeProvider>
  );
}

export default TeacherGameRoomPage;
