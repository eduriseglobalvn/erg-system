import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { fetchGameRoomAsHost } from "@/features/games/game-api";
import type { ClientMessage, RoomSummary } from "@/features/games/game-types";
import { HACK_GAME_DISPLAY_NAME, hk } from "@/features/games/hack/hack-tokens";
import { formatClock, HackScreen } from "@/features/games/hack/ui/hack-ui";
import { remainingMs, selectHostScreen, type RoomViewState } from "@/features/games/room-state";
import { EndedView } from "@/features/games/teacher/ended-view";
import { LiveView } from "@/features/games/teacher/live-view";
import { LobbyView } from "@/features/games/teacher/lobby-view";
import { useGameSocket } from "@/features/games/use-game-socket";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

type HostRoomViewProps = {
  state: RoomViewState;
  room: RoomSummary | undefined;
  teacherLabel: string;
  joinUrl: string;
  send: (message: ClientMessage) => boolean;
  onExit: () => void;
};

/** Teacher control room: socket state in, lobby / projector / final ranking out. */
export function HostRoom({ roomId }: { roomId: string }) {
  const { state, send } = useGameSocket(roomId);
  const room = useQuery({ queryKey: ["games", "host-room", roomId], queryFn: () => fetchGameRoomAsHost(roomId), staleTime: 60_000, retry: 1 });
  const navigate = useNavigate();
  const account = getCurrentAccount("lms");
  const teacherLabel = account?.email ?? account?.fullName ?? HACK_GAME_DISPLAY_NAME;
  const joinUrl = `${window.location.host}/student/games`;
  const exit = useCallback(() => { void navigate({ href: teacherPath("/games") }); }, [navigate]);
  return <HostRoomView state={state} room={room.data} teacherLabel={teacherLabel} joinUrl={joinUrl} send={send} onExit={exit} />;
}

/** Pure view of `state`; the dev preview feeds it fixed states instead of a socket. */
export function HostRoomView({ state, room, teacherLabel, joinUrl, send, onExit }: HostRoomViewProps) {
  const [confirm, setConfirm] = useState<"end" | "cancel" | null>(null);
  const screen = selectHostScreen(state);

  useEffect(() => {
    if (state.error) toast.error(state.error.message);
  }, [state.error]);

  const command = useCallback((type: "host.start" | "host.pause" | "host.resume" | "host.end") => {
    if (!send({ type, data: {} })) toast.error("Mất kết nối, thử lại sau ít giây.");
  }, [send]);
  const confirmed = () => { if (confirm) command("host.end"); setConfirm(null); };
  const feedClock = useCallback((at: string) => {
    const stamp = Date.parse(at);
    return state.endsAt === null || Number.isNaN(stamp) ? null : formatClock(state.endsAt - stamp);
  }, [state.endsAt]);
  const busy = state.connection !== "open";

  return (
    <>
      {screen === "LOBBY" ? (
        <LobbyView room={room} lobby={state.lobby} teacherLabel={teacherLabel} joinUrl={joinUrl} busy={busy} onStart={() => command("host.start")} onCancel={() => setConfirm("cancel")} />
      ) : screen === "LIVE" && state.phase ? (
        <LiveView
          roomCode={room?.code ?? ""}
          teacherLabel={teacherLabel}
          phase={state.phase}
          getRemainingMs={() => remainingMs(state, Date.now())}
          getCountdownMs={() => (state.countdownStartsAt === null ? 0 : state.countdownStartsAt - (Date.now() + state.clockOffsetMs))}
          leaderboard={state.leaderboard}
          feed={state.feed}
          feedClock={feedClock}
          stats={state.stats}
          allowHack={room?.rules.allowHack ?? false}
          busy={busy}
          onPause={() => command("host.pause")}
          onResume={() => command("host.resume")}
          onEnd={() => setConfirm("end")}
        />
      ) : screen === "ENDED" || screen === "CANCELLED" ? (
        <EndedView room={room} teacherLabel={teacherLabel} final={state.ended?.final ?? []} cancelled={screen === "CANCELLED"} onExit={onExit} />
      ) : (
        <HackScreen phone={false} label="Đang tải phòng"><span style={{ position: "relative", color: hk.color.dim, padding: 24 }}>Đang kết nối phòng...</span></HackScreen>
      )}
      <ErgConfirmDialog
        open={confirm !== null}
        title={confirm === "cancel" ? "Hủy phòng này?" : "Kết thúc trận sớm?"}
        description={confirm === "cancel" ? "Học sinh đã vào phòng sẽ bị đưa ra ngoài." : "Trận dừng ngay và chốt bảng xếp hạng hiện tại. Không hoàn tác được."}
        confirmLabel={confirm === "cancel" ? "Hủy phòng" : "Kết thúc"}
        cancelLabel="Quay lại"
        destructive
        onConfirm={confirmed}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
