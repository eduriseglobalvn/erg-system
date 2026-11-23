import type {
  AnswerResultData,
  ClassStats,
  FinalEntry,
  GameScreen,
  LeaderboardData,
  LobbyData,
  LootResultData,
  PlayerState,
  QuestionPayload,
  RoomEndedData,
  RoomStatus,
  ServerMessage,
} from "@/features/games/game-types";

export type ConnectionStatus = "idle" | "connecting" | "open" | "reconnecting" | "failed";
export type QuestionMark = "ok" | "wrong";

export type RoomViewState = {
  connection: ConnectionStatus;
  /** 1-based reconnect attempt shown on the "mất kết nối" screen. */
  attempt: number;
  lastSeq: number;
  phase: RoomStatus | null;
  screen: GameScreen | null;
  /** serverNow - Date.now() at the last sync; add to Date.now() to read the server clock. */
  clockOffsetMs: number;
  endsAt: number | null;
  pausedRemainingMs: number | null;
  countdownStartsAt: number | null;
  me: PlayerState | null;
  question: QuestionPayload | null;
  answerResult: AnswerResultData | null;
  lootResult: LootResultData | null;
  lootOffered: boolean;
  /** My rank just before the last loot pack was opened, for "lên hạng N" on screen 07. */
  rankBeforeLoot: number | null;
  lobby: LobbyData | null;
  leaderboard: LeaderboardData | null;
  feed: { at: string; text: string; tone: string }[];
  /** Host only: class.stats. */
  stats: ClassStats | null;
  marks: Record<number, QuestionMark>;
  ended: RoomEndedData | null;
  error: { code: string; message: string } | null;
  /** Wall-clock ms of the moment the connection dropped (for "rớt mạng lúc"). */
  droppedAtMs: number | null;
};

export const initialRoomViewState: RoomViewState = {
  connection: "idle",
  attempt: 0,
  lastSeq: 0,
  phase: null,
  screen: null,
  clockOffsetMs: 0,
  endsAt: null,
  pausedRemainingMs: null,
  countdownStartsAt: null,
  me: null,
  question: null,
  answerResult: null,
  lootResult: null,
  lootOffered: false,
  rankBeforeLoot: null,
  lobby: null,
  leaderboard: null,
  feed: [],
  stats: null,
  marks: {},
  ended: null,
  error: null,
  droppedAtMs: null,
};

const FEED_LIMIT = 6;

function isLootResult(value: unknown): value is LootResultData {
  return typeof value === "object" && value !== null && "pickedSlot" in value;
}

/** Pure: server message -> next view state. Messages at or below `lastSeq` are replays after a resume and are ignored. */
export function applyServerMessage(state: RoomViewState, message: ServerMessage, nowMs: number): RoomViewState {
  if (message.seq <= state.lastSeq && message.type !== "room.state") return state;
  const next: RoomViewState = { ...state, lastSeq: Math.max(state.lastSeq, message.seq) };

  switch (message.type) {
    case "room.state": {
      const { data } = message;
      const result = data.lastResult;
      const lootResult = isLootResult(data.loot) ? data.loot : isLootResult(result) ? result : null;
      return {
        ...next,
        phase: data.phase,
        screen: data.screen,
        clockOffsetMs: data.serverNow - nowMs,
        endsAt: data.endsAt ?? null,
        pausedRemainingMs: data.pausedRemainingMs ?? null,
        me: data.me ?? state.me,
        question: data.question ?? null,
        answerResult: result && !isLootResult(result) ? result : null,
        lootResult,
        lootOffered: data.screen === "LOOT_PICK",
        countdownStartsAt: data.countdownStartsAt ?? state.countdownStartsAt,
        ended: data.ended ?? state.ended,
        lobby: data.lobby ?? state.lobby,
        leaderboard: data.leaderboard ?? state.leaderboard,
      };
    }
    case "room.lobby":
      return { ...next, lobby: message.data };
    case "room.countdown":
      return { ...next, screen: "COUNTDOWN", clockOffsetMs: message.data.serverNow - nowMs, countdownStartsAt: message.data.startsAt };
    case "room.phase": {
      const { phase, endsAt, pausedRemainingMs } = message.data;
      return { ...next, phase, endsAt: endsAt ?? state.endsAt, pausedRemainingMs: pausedRemainingMs ?? null };
    }
    case "question":
      return { ...next, screen: "QUESTION", question: message.data, answerResult: null, lootResult: null, lootOffered: false };
    case "answer.result": {
      const { data } = message;
      const index = state.question?.index;
      return {
        ...next,
        me: data.me,
        answerResult: data,
        screen: data.correct ? state.screen : "EXPLAIN",
        marks: index === undefined ? state.marks : { ...state.marks, [index]: data.correct ? "ok" : "wrong" },
      };
    }
    case "loot.offer":
      return { ...next, screen: "LOOT_PICK", lootOffered: true };
    case "loot.result":
      return { ...next, screen: "LOOT_RESULT", lootResult: message.data, me: message.data.me, lootOffered: false, rankBeforeLoot: state.me?.rank ?? null };
    case "leaderboard":
      return { ...next, leaderboard: message.data };
    case "feed":
      return { ...next, feed: [...message.data.items.slice().reverse(), ...state.feed].slice(0, FEED_LIMIT) };
    case "class.stats":
      return { ...next, stats: message.data };
    case "room.ended":
      return { ...next, phase: "ENDED", screen: "ENDED", ended: message.data };
    case "error":
      return { ...next, error: message.data };
    default:
      return next;
  }
}

/** Every screen the student client can show; the 08-12 hack screens are a later batch and fall back to "WAITING". */
export type HackScreenId =
  | "JOIN"
  | "LOBBY"
  | "COUNTDOWN"
  | "QUESTION"
  | "WRONG"
  | "LOOT"
  | "LOOT_OPEN"
  | "LOOT_EMPTY"
  | "RECONNECT"
  | "TIME_UP"
  | "RESULT"
  | "WAITING"
  | "LOADING";

/** Which screen the room is on. Reconnect overrides everything except a finished game. */
export function selectHackScreen(state: RoomViewState): HackScreenId {
  if (state.phase === "ENDED" || state.screen === "ENDED") return state.ended ? "RESULT" : "TIME_UP";
  if (state.connection === "reconnecting" || state.connection === "failed") return "RECONNECT";
  if (state.phase === "ENDING") return "TIME_UP";
  switch (state.screen) {
    case "LOBBY":
      return "LOBBY";
    case "COUNTDOWN":
      return "COUNTDOWN";
    case "QUESTION":
      return state.question ? "QUESTION" : "LOADING";
    case "EXPLAIN":
      return state.answerResult ? "WRONG" : "LOADING";
    case "LOOT_PICK":
      return "LOOT";
    case "LOOT_RESULT": {
      const picked = state.lootResult?.slots[state.lootResult.pickedSlot];
      if (!picked) return "LOADING";
      return picked.kind === "EMPTY" ? "LOOT_EMPTY" : "LOOT_OPEN";
    }
    case "DONE_WAITING":
      return "WAITING";
    default:
      return "LOADING";
  }
}

export type HostScreenId = "LOADING" | "LOBBY" | "LIVE" | "ENDED" | "CANCELLED";

/** Which teacher view the room is on, from the phase alone (the host has no player screen: `me` is null). */
export function selectHostScreen(state: RoomViewState): HostScreenId {
  switch (state.phase) {
    case "LOBBY":
      return "LOBBY";
    case "COUNTDOWN":
    case "RUNNING":
    case "PAUSED":
    case "ENDING":
      return "LIVE";
    case "ENDED":
      return "ENDED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "LOADING";
  }
}

export function finalMe(state: RoomViewState): FinalEntry | null {
  return state.ended?.me ?? null;
}

/** ms left on the shared clock (paused rooms report the frozen value). */
export function remainingMs(state: RoomViewState, nowMs: number): number {
  if (state.phase === "PAUSED" && state.pausedRemainingMs !== null) return Math.max(0, state.pausedRemainingMs);
  if (state.endsAt === null) return 0;
  return Math.max(0, state.endsAt - (nowMs + state.clockOffsetMs));
}
