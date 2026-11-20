import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createGameSocket, toWebSocketUrl, type SocketStatus } from "@/features/games/game-socket";

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.(); }
  drop() { this.readyState = 3; this.onclose?.(); }
}

function setup(lastSeq = 0) {
  const statuses: [SocketStatus, number][] = [];
  const messages: unknown[] = [];
  const socket = createGameSocket({
    url: "wss://x/ws/games/r1",
    getLastSeq: () => lastSeq,
    onMessage: (message) => messages.push(message),
    onStatus: (status, attempt) => statuses.push([status, attempt]),
    WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
    backoffMs: () => 100,
  });
  return { socket, statuses, messages };
}

describe("game socket", () => {
  beforeEach(() => { FakeSocket.instances = []; vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it("builds a ws url from the api base", () => {
    expect(toWebSocketUrl("https://api.erg.edu.vn/", "/ws/games/1")).toBe("wss://api.erg.edu.vn/ws/games/1");
    expect(toWebSocketUrl("http://localhost:3001", "/ws/games/1")).toBe("ws://localhost:3001/ws/games/1");
  });

  it("sends resume with the last seq on open and reconnects after a drop", () => {
    const { statuses, messages } = setup(7);
    FakeSocket.instances[0].open();
    expect(JSON.parse(FakeSocket.instances[0].sent[0])).toEqual({ type: "resume", data: { lastSeq: 7 } });
    FakeSocket.instances[0].onmessage?.({ data: JSON.stringify({ type: "room.lobby", seq: 8, data: {} }) });
    FakeSocket.instances[0].onmessage?.({ data: "not json" });
    expect(messages).toHaveLength(1);

    FakeSocket.instances[0].drop();
    expect(statuses.at(-1)).toEqual(["reconnecting", 1]);
    vi.advanceTimersByTime(100);
    expect(FakeSocket.instances).toHaveLength(2);
    FakeSocket.instances[1].open();
    expect(statuses.at(-1)).toEqual(["open", 0]);
    expect(JSON.parse(FakeSocket.instances[1].sent[0]).data.lastSeq).toBe(7);
  });

  it("gives up after 5 retries and retryNow starts a fresh budget", () => {
    const { socket, statuses } = setup();
    for (let round = 0; round < 6; round += 1) {
      FakeSocket.instances.at(-1)!.drop();
      vi.advanceTimersByTime(100);
    }
    expect(statuses.at(-1)).toEqual(["failed", 5]);
    expect(FakeSocket.instances).toHaveLength(6); // first connect + 5 retries
    socket.retryNow();
    expect(FakeSocket.instances).toHaveLength(7);
    expect(statuses.at(-1)).toEqual(["connecting", 0]);
  });

  it("refuses to send while not open and stops reconnecting once closed", () => {
    const { socket } = setup();
    expect(socket.send({ type: "next", data: {} })).toBe(false);
    FakeSocket.instances[0].open();
    expect(socket.send({ type: "next", data: {} })).toBe(true);
    socket.close();
    FakeSocket.instances[0].onclose?.();
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.instances).toHaveLength(1);
  });
});
