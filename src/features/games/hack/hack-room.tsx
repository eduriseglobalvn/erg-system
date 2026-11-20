import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { AnswerPayload } from "@/domain/quiz/types";
import { fetchGameRoom } from "@/features/games/game-api";
import type { ClientMessage, RoomSummary } from "@/features/games/game-types";
import { CountdownScreen, ReconnectScreen, TimeUpScreen, WaitingScreen } from "@/features/games/hack/screens/transition-screens";
import { LobbyScreen } from "@/features/games/hack/screens/lobby-screen";
import { LootScreen } from "@/features/games/hack/screens/loot-screen";
import { LootEmptyScreen, LootOpenScreen } from "@/features/games/hack/screens/loot-result-screens";
import { QuestionScreen } from "@/features/games/hack/screens/question-screen";
import { ResultScreen } from "@/features/games/hack/screens/result-screen";
import { WrongScreen } from "@/features/games/hack/screens/wrong-screen";
import { useHackPhone, formatClock } from "@/features/games/hack/ui/hack-ui";
import { hk } from "@/features/games/hack/hack-tokens";
import { remainingMs, selectHackScreen, type RoomViewState } from "@/features/games/room-state";
import { useGameSocket } from "@/features/games/use-game-socket";
import { studentPath } from "@/platform/workspaces/workspace-paths";

const SUBMIT_GAP_MS = 1000;

type HackRoomViewProps = {
  state: RoomViewState;
  room: RoomSummary | undefined;
  send: (message: ClientMessage) => boolean;
  retryNow: () => void;
};

/** Student game room: socket state in, one screen out (screens 02-15; 08-12 are a later batch). */
export function HackRoom({ roomId }: { roomId: string }) {
  const { state, send, retryNow } = useGameSocket(roomId);
  const room = useQuery({ queryKey: ["games", "room", roomId], queryFn: () => fetchGameRoom(roomId), staleTime: 60_000, retry: 1 });
  return <HackRoomView state={state} room={room.data} send={send} retryNow={retryNow} />;
}

/** Teacher paused the room: amber strip over the current screen; answers are locked and the clock is frozen. */
function PausedBanner({ phone, clock }: { phone: boolean; clock: string }) {
  const c = hk.color;
  return (
    <Box role="status" sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", bgcolor: c.amberPanel, borderBottom: `2px solid ${c.yellow}`, color: c.amberSoft, padding: phone ? "8px 14px" : "10px 24px", fontSize: phone ? hk.fs[12] : hk.fs[14], fontWeight: hk.font.weightBold }}>
      <span><Box component="span" sx={{ color: c.yellow }}>[!!]</Box> {phone ? "CÔ GIÁO TẠM DỪNG" : "CÔ GIÁO TẠM DỪNG · đồng hồ đứng yên, chờ cô cho chạy tiếp"}</span>
      <Box component="span" sx={{ color: c.yellow }}>{clock}</Box>
    </Box>
  );
}

/** The state machine as a pure view of `state`; the dev preview feeds it fixed states instead of a socket. */
export function HackRoomView(props: HackRoomViewProps) {
  const phone = useHackPhone();
  const paused = props.state.phase === "PAUSED" && selectHackScreen(props.state) !== "RESULT";
  return (
    <>
      <HackRoomScreen {...props} />
      {paused ? <PausedBanner phone={phone} clock={formatClock(props.state.pausedRemainingMs ?? 0)} /> : null}
    </>
  );
}

function HackRoomScreen({ state, room, send, retryNow }: HackRoomViewProps) {
  const phone = useHackPhone();
  const navigate = useNavigate();
  const [sent, setSent] = useState<{ questionId: string; answer: AnswerPayload } | null>(null);
  const shownAt = useRef(0);
  const questionId = state.question?.question.id;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [questionId]);

  useEffect(() => {
    if (state.error) toast.error(state.error.message);
  }, [state.error]);

  const leave = useCallback(() => { void navigate({ href: studentPath("/games") }); }, [navigate]);
  const getRemainingMs = useCallback((nowMs: number) => remainingMs(state, nowMs), [state]);
  const next = useCallback(() => { send({ type: "next", data: {} }); }, [send]);
  const pick = useCallback((slot: number) => { send({ type: "loot.pick", data: { slot } }); }, [send]);
  const lastSubmitAt = useRef(0);
  const submit = useCallback(
    (id: string, answer: AnswerPayload) => {
      // The server takes 1 answer per second per player; swallow a double tap instead of getting an error.
      if (Date.now() - lastSubmitAt.current < SUBMIT_GAP_MS) return;
      lastSubmitAt.current = Date.now();
      setSent({ questionId: id, answer });
      send({ type: "answer", data: { questionId: id, answer, clientMs: Date.now() - shownAt.current } });
    },
    [send],
  );

  const locked = state.connection !== "open" || state.phase === "PAUSED";
  const screen = selectHackScreen(state);
  const { me } = state;

  switch (screen) {
    case "LOBBY":
      return <LobbyScreen phone={phone} me={me} lobby={state.lobby} room={room} onLeave={leave} />;
    case "COUNTDOWN":
      return <CountdownScreen phone={phone} startsAt={state.countdownStartsAt} clockOffsetMs={state.clockOffsetMs} questionCount={room?.questionCount} durationMinutes={room?.durationMinutes} />;
    case "QUESTION":
      if (!me || !state.question) return <WaitingScreen phone={phone} />;
      return (
        <QuestionScreen
          key={state.question.question.id}
          phone={phone}
          me={me}
          payload={state.question}
          marks={state.marks}
          getRemainingMs={getRemainingMs}
          leaderboard={state.leaderboard}
          feed={state.feed}
          locked={locked}
          onSubmit={submit}
        />
      );
    case "WRONG":
      if (!me || !state.answerResult) return <WaitingScreen phone={phone} />;
      return <WrongScreen phone={phone} me={me} result={state.answerResult} payload={state.question} answered={sent && sent.questionId === questionId ? sent.answer : null} getRemainingMs={getRemainingMs} locked={locked} onNext={next} />;
    case "LOOT":
      if (!me) return <WaitingScreen phone={phone} />;
      return <LootScreen phone={phone} me={me} starsGained={state.answerResult?.starsGained ?? 0} getRemainingMs={getRemainingMs} locked={locked} onPick={pick} />;
    case "LOOT_OPEN":
      return state.lootResult ? <LootOpenScreen phone={phone} result={state.lootResult} rankBefore={state.rankBeforeLoot} locked={locked} onNext={next} /> : <WaitingScreen phone={phone} />;
    case "LOOT_EMPTY":
      return state.lootResult ? <LootEmptyScreen phone={phone} result={state.lootResult} starsGained={state.answerResult?.starsGained ?? 0} getRemainingMs={getRemainingMs} locked={locked} onNext={next} /> : <WaitingScreen phone={phone} />;
    case "RECONNECT":
      return <ReconnectScreen phone={phone} attempt={state.attempt} failed={state.connection === "failed"} droppedClock={state.droppedAtMs ? formatClock(remainingMs(state, state.droppedAtMs)) : null} me={me} onRetry={retryNow} onLeave={leave} />;
    case "TIME_UP":
      return <TimeUpScreen phone={phone} me={me} />;
    case "RESULT":
      return state.ended ? <ResultScreen phone={phone} ended={state.ended} room={room} onLeave={leave} /> : <WaitingScreen phone={phone} />;
    case "WAITING":
      return <WaitingScreen phone={phone} done />;
    default:
      return <WaitingScreen phone={phone} />;
  }
}

