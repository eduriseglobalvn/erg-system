import type { AnswerResult, Question } from "@/domain/quiz/types";

// Contract: wayground/HOP_DONG_API.md. Keep names in step with the backend.

export type GameType = "HACK";
export type RoomStatus = "LOBBY" | "COUNTDOWN" | "RUNNING" | "PAUSED" | "ENDING" | "ENDED" | "CANCELLED";
export type GameScreen = "LOBBY" | "COUNTDOWN" | "QUESTION" | "EXPLAIN" | "LOOT_PICK" | "LOOT_RESULT" | "DONE_WAITING" | "ENDED";
export type LootKind = "EMPTY" | "SCRAP" | "SMALL_WALLET" | "BIG_WALLET" | "VAULT" | "HACK_COMMAND";

export type RoomRules = {
  allowHack: boolean;
  emergencyPatch: boolean;
  showLeaderboard: boolean;
  showSolution: boolean;
  allowLateJoin: boolean;
  questionOrder: "RANDOM" | "LESSON" | "WRONG_FIRST";
};

export type QuestionSet = "ALL" | "CLASS_WRONG";

export type RoomSummary = {
  id: string;
  gameType: GameType;
  code: string;
  status: RoomStatus;
  classId: string;
  className: string;
  quizId: string;
  quizVersionId: string;
  quizTitle: string;
  questionSet: QuestionSet;
  durationMinutes: number;
  rules: RoomRules;
  playerCount: number;
  questionCount: number;
  /** Correct answers / all answers of the room (0..1); null until somebody answered. */
  accuracy: number | null;
  createdAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type PlayerState = {
  playerId: string;
  displayName: string;
  stars: number;
  coins: number;
  streak: number;
  firewall: boolean;
  rank: number;
  playerCount: number;
  answeredCount: number;
  correctCount: number;
};

/** The question DTO is the same one the normal quiz player gets (answer key stripped). */
/** `index` is the 1-based mission number (correct answers + 1, at most `total`). */
export type QuestionPayload = { index: number; total: number; question: Question };

/** Correct-answer fields of the normal AnswerResult (correctChoiceIds, correctSequenceOrder, ...). */
export type CorrectAnswer = Partial<Omit<AnswerResult, "questionId" | "correct">>;

export type AnswerResultData = {
  questionId: string;
  correct: boolean;
  correctAnswer?: CorrectAnswer | null;
  solution?: string | null;
  starsGained: number;
  me: PlayerState;
  requeueAfter?: number | null;
};

export type LootSlotData = { kind: LootKind; coins: number };
export type LootResultData = { pickedSlot: number; slots: LootSlotData[]; me: PlayerState };

export type LeaderEntry = { playerId: string; displayName: string; stars: number; coins: number; total: number; rank: number };
/** `firewall` drives the "[TL]" mark next to a player on the question screen. */
export type LeaderboardData = { top: (LeaderEntry & { firewall: boolean })[]; me: { rank: number; total: number } };
export type FeedItem = { at: string; text: string; tone: "info" | "loot" | "firewall" };
/**
 * `classSize` = enrolled students of the class (for "28 / 32 MÁY" and "còn chờ N máy").
 * `missing` = class students not in the room yet; only the host receives it (students get []).
 */
export type LobbyData = { players: { playerId: string; displayName: string }[]; count: number; classSize: number; missing: { userId: string; displayName: string }[] };

export type FinalEntry = LeaderEntry & { correctCount: number; answeredCount: number; longestStreak: number };
export type RoomEndedData = {
  final: FinalEntry[];
  me?: FinalEntry & { weakQuestions: { questionId: string; title: string; /** 0-based position in the room's question list; show `index + 1` */ index: number; wrongCount: number }[] };
};

/** Host only (class.stats, at most once per 2 s). `wrongRate` is a fraction 0..1; `wrongPlayers` counts machines, not attempts. */
export type ClassStats = {
  answeredTotal: number;
  accuracy: number;
  perQuestion: { questionId: string; title: string; wrongRate: number; wrongPlayers: number; answeredPlayers: number }[];
  playersOnline: number;
  playerCount: number;
  /** Mean correctCount, one decimal. */
  avgProgress: number;
  /** Missions in the game. */
  questionTotal: number;
  firewallOn: number;
  hackWins: number;
};

/** GET /sources item: one published quiz version the teacher can open a room from. */
export type GameSource = {
  quizVersionId: string;
  quizId: string;
  title: string;
  versionNumber: number;
  publishedAt: string;
  questionCount: number;
  playableCount: number;
  filteredCount: number;
  /** Questions dropped by the room filter, by kind (essay, likert_scale, ...). */
  filteredByKind: Record<string, number>;
  /** Only with a classId: enrolled students, and playable questions the class got wrong in earlier ended rooms. */
  classSize?: number | null;
  classWrongCount?: number | null;
  /** Latest ended room of this teacher on the quiz (any version), or null. */
  lastGame?: { roomId: string; gameType: GameType; className: string; endedAt: string } | null;
};

/** POST /rooms body. */
export type CreateRoomBody = {
  gameType: GameType;
  quizVersionId: string;
  classId: string;
  durationMinutes: number;
  questionSet: QuestionSet;
  rules: RoomRules;
};

export type RoomStateData = {
  phase: RoomStatus;
  serverNow: number;
  endsAt?: number | null;
  pausedRemainingMs?: number | null;
  me?: PlayerState | null;
  screen: GameScreen;
  question?: QuestionPayload | null;
  /** Assumption: an answer.result shape on EXPLAIN, a loot.result shape on LOOT_RESULT. */
  lastResult?: AnswerResultData | LootResultData | null;
  leaderboard?: LeaderboardData | null;
  lobby?: LobbyData | null;
  /** Rebuilds the pack screen on reconnect: a result once a pack was opened, `{ slots }` while the offer is pending. */
  loot?: LootResultData | { slots: number } | null;
  countdownStartsAt?: number | null;
  /** Final result when the room is already ENDED. */
  ended?: RoomEndedData | null;
};

export type ServerMessage =
  | { type: "room.state"; seq: number; data: RoomStateData }
  | { type: "room.lobby"; seq: number; data: LobbyData }
  | { type: "room.countdown"; seq: number; data: { startsAt: number; serverNow: number } }
  | { type: "room.phase"; seq: number; data: { phase: RoomStatus; endsAt?: number | null; pausedRemainingMs?: number | null } }
  | { type: "question"; seq: number; data: QuestionPayload }
  | { type: "answer.result"; seq: number; data: AnswerResultData }
  | { type: "loot.offer"; seq: number; data: { slots: number } }
  | { type: "loot.result"; seq: number; data: LootResultData }
  | { type: "leaderboard"; seq: number; data: LeaderboardData }
  | { type: "feed"; seq: number; data: { items: FeedItem[] } }
  | { type: "class.stats"; seq: number; data: ClassStats }
  | { type: "room.ended"; seq: number; data: RoomEndedData }
  | { type: "error"; seq: number; data: { code: string; message: string } };

export type ClientMessage =
  | { type: "resume"; data: { lastSeq: number } }
  | { type: "answer"; data: { questionId: string; answer: unknown; clientMs: number } }
  | { type: "loot.pick"; data: { slot: number } }
  | { type: "next"; data: Record<string, never> }
  | { type: "host.start" | "host.pause" | "host.resume" | "host.end"; data: Record<string, never> };
