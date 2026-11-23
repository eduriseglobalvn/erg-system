import { lazy, Suspense } from "react";

import { HackRoom } from "@/features/games/hack/hack-room";
import { HackThemeProvider } from "@/features/games/hack/hack-theme";

// Dev-only visual preview with fixed states (no socket): /student/games/preview?screen=loot&kind=matching. Dropped from production builds.
const PreviewRoom = import.meta.env.DEV ? lazy(() => import("@/features/games/hack/dev/preview-room")) : null;

/** /student/games/$roomId: lobby to result of one room (full screen, no portal shell). */
export function StudentGameRoomPage({ roomId }: { roomId: string }) {
  return (
    <HackThemeProvider>
      {PreviewRoom && roomId === "preview" ? (
        <Suspense fallback={null}><PreviewRoom /></Suspense>
      ) : (
        <HackRoom key={roomId} roomId={roomId} />
      )}
    </HackThemeProvider>
  );
}

export default StudentGameRoomPage;
