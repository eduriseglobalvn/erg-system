import { describe, expect, it } from "vitest";

import type { PlayerState, ServerMessage } from "@/features/games/game-types";
import { applyServerMessage, initialRoomViewState, remainingMs, selectHackScreen, selectHostScreen, type RoomViewState } from "@/features/games/room-state";

const me: PlayerState = { playerId: "p1", displayName: "Minh Anh", stars: 100, coins: 0, streak: 1, firewall: false, rank: 1, playerCount: 2, answeredCount: 1, correctCount: 1 };
const question = { id: "q1", kind: "single_choice", title: "?", points: 1, feedback: { correct: "", incorrect: "", partial: "" }, choices: [] } as never;

function run(messages: ServerMessage[], start: RoomViewState = initialRoomViewState) {
  return messages.reduce((state, message) => applyServerMessage(state, message, 1_000), start);
}

describe("room state machine", () => {
  it("walks lobby -> countdown -> question -> wrong -> question", () => {
    let state = run([{ type: "room.state", seq: 1, data: { phase: "LOBBY", serverNow: 1_000, screen: "LOBBY", me } }]);
    expect(selectHackScreen(state)).toBe("LOBBY");
    state = run([{ type: "room.countdown", seq: 2, data: { startsAt: 4_000, serverNow: 1_000 } }], state);
    expect(selectHackScreen(state)).toBe("COUNTDOWN");
    state = run([{ type: "question", seq: 3, data: { index: 0, total: 20, question } }], { ...state, connection: "open" });
    expect(selectHackScreen(state)).toBe("QUESTION");
    state = run([{ type: "answer.result", seq: 4, data: { questionId: "q1", correct: false, starsGained: 0, me, requeueAfter: 3 } }], state);
    expect(selectHackScreen(state)).toBe("WRONG");
    expect(state.marks[0]).toBe("wrong");
    state = run([{ type: "question", seq: 5, data: { index: 1, total: 20, question } }], state);
    expect(selectHackScreen(state)).toBe("QUESTION");
    expect(state.answerResult).toBeNull();
  });

  it("right answer waits for loot.offer, then shows the open or empty pack", () => {
    const asked = run([{ type: "room.state", seq: 1, data: { phase: "RUNNING", serverNow: 0, screen: "QUESTION", me, question: { index: 0, total: 3, question } } }]);
    let state = run([{ type: "answer.result", seq: 2, data: { questionId: "q1", correct: true, starsGained: 110, me } }], asked);
    expect(selectHackScreen(state)).toBe("QUESTION");
    expect(state.marks[0]).toBe("ok");
    state = run([{ type: "loot.offer", seq: 3, data: { slots: 3 } }], state);
    expect(selectHackScreen(state)).toBe("LOOT");
    const slots = [{ kind: "SCRAP", coins: 50 }, { kind: "EMPTY", coins: 0 }, { kind: "SMALL_WALLET", coins: 150 }] as const;
    const empty = run([{ type: "loot.result", seq: 4, data: { pickedSlot: 1, slots: [...slots], me } }], state);
    expect(selectHackScreen(empty)).toBe("LOOT_EMPTY");
    const open = run([{ type: "loot.result", seq: 4, data: { pickedSlot: 2, slots: [...slots], me } }], state);
    expect(selectHackScreen(open)).toBe("LOOT_OPEN");
  });

  it("ignores replayed seq numbers after a resume but always accepts a full room.state", () => {
    const state = run([{ type: "room.lobby", seq: 5, data: { players: [], count: 3, classSize: 32, missing: [] } }]);
    const replay = applyServerMessage(state, { type: "room.lobby", seq: 4, data: { players: [], count: 1, classSize: 32, missing: [] } }, 0);
    expect(replay.lobby?.count).toBe(3);
    const snapshot = applyServerMessage(state, { type: "room.state", seq: 2, data: { phase: "LOBBY", serverNow: 0, screen: "LOBBY", lobby: { players: [], count: 9, classSize: 32, missing: [] } } }, 0);
    expect(snapshot.lobby?.count).toBe(9);
    expect(snapshot.lastSeq).toBe(5);
  });

  it("shows reconnect over any screen except a finished game, and time-up then result at the end", () => {
    const running = run([{ type: "room.state", seq: 1, data: { phase: "RUNNING", serverNow: 0, screen: "QUESTION", me, question: { index: 0, total: 1, question } } }]);
    expect(selectHackScreen({ ...running, connection: "reconnecting" })).toBe("RECONNECT");
    expect(selectHackScreen({ ...running, connection: "failed" })).toBe("RECONNECT");
    const ending = run([{ type: "room.phase", seq: 2, data: { phase: "ENDING" } }], running);
    expect(selectHackScreen(ending)).toBe("TIME_UP");
    const ended = run([{ type: "room.ended", seq: 3, data: { final: [] } }], ending);
    expect(selectHackScreen({ ...ended, connection: "reconnecting" })).toBe("RESULT");
  });

  it("derives the clock from serverNow and freezes it while paused", () => {
    const state = run([{ type: "room.state", seq: 1, data: { phase: "RUNNING", serverNow: 5_000, endsAt: 65_000, screen: "QUESTION" } }]);
    // local now was 1 000 when the snapshot arrived: offset +4 000.
    expect(remainingMs(state, 1_000)).toBe(60_000);
    expect(remainingMs(state, 31_000)).toBe(30_000);
    const paused = run([{ type: "room.phase", seq: 2, data: { phase: "PAUSED", pausedRemainingMs: 42_000 } }], state);
    expect(remainingMs(paused, 99_000)).toBe(42_000);
  });

  it("keeps my rank from before the pack and rebuilds a picked pack from room.state.loot", () => {
    const before = { ...me, rank: 4 };
    const slots = [{ kind: "SCRAP", coins: 50 }, { kind: "BIG_WALLET", coins: 400 }, { kind: "EMPTY", coins: 0 }] as const;
    const opened = run([{ type: "loot.result", seq: 2, data: { pickedSlot: 1, slots: [...slots], me: { ...me, rank: 3 } } }], { ...initialRoomViewState, me: before, lastSeq: 1 });
    expect(opened.rankBeforeLoot).toBe(4);
    expect(opened.me?.rank).toBe(3);
    const resumed = run([{ type: "room.state", seq: 9, data: { phase: "RUNNING", serverNow: 0, screen: "LOOT_RESULT", me, loot: { pickedSlot: 0, slots: [...slots], me }, countdownStartsAt: 5_000 } }]);
    expect(selectHackScreen(resumed)).toBe("LOOT_OPEN");
    expect(resumed.countdownStartsAt).toBe(5_000);
  });

  it("host: me stays null, phases pick the teacher view and class.stats is kept", () => {
    let state = run([{ type: "room.state", seq: 1, data: { phase: "LOBBY", serverNow: 1_000, screen: "LOBBY", me: null, lobby: { players: [], count: 0, classSize: 32, missing: [] } } }]);
    expect(state.me).toBeNull();
    expect(selectHostScreen(state)).toBe("LOBBY");
    expect(selectHostScreen(initialRoomViewState)).toBe("LOADING");
    state = run([{ type: "room.phase", seq: 2, data: { phase: "RUNNING", endsAt: 61_000 } }], state);
    expect(selectHostScreen(state)).toBe("LIVE");
    const stats = { answeredTotal: 5, accuracy: 0.74, perQuestion: [{ questionId: "q1", title: "Q", wrongRate: 0.5, wrongPlayers: 1, answeredPlayers: 2 }], playersOnline: 3, playerCount: 4, avgProgress: 1.5, questionTotal: 10, firewallOn: 1, hackWins: 0 };
    state = run([{ type: "class.stats", seq: 3, data: stats }], state);
    expect(state.stats).toEqual(stats);
    expect(state.me).toBeNull();
    state = run([{ type: "room.phase", seq: 4, data: { phase: "PAUSED", pausedRemainingMs: 30_000 } }], state);
    expect(selectHostScreen(state)).toBe("LIVE");
    expect(remainingMs(state, 5_000)).toBe(30_000);
    state = run([{ type: "room.ended", seq: 5, data: { final: [] } }], state);
    expect(selectHostScreen(state)).toBe("ENDED");
    expect(selectHostScreen({ ...state, phase: "CANCELLED" })).toBe("CANCELLED");
  });
});
