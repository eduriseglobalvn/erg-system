import type { ClientMessage, ServerMessage } from "@/features/games/game-types";

export type SocketStatus = "connecting" | "open" | "reconnecting" | "failed";

export type GameSocketOptions = {
  url: string;
  /** Latest server seq already applied; sent as `resume` on every (re)connect. */
  getLastSeq: () => number;
  onMessage: (message: ServerMessage) => void;
  /** `attempt` is the 1-based retry in flight while status is "reconnecting". */
  onStatus: (status: SocketStatus, attempt: number) => void;
  maxRetries?: number;
  /** Delay before retry n (1-based), ms. */
  backoffMs?: (attempt: number) => number;
  WebSocketImpl?: typeof WebSocket;
};

export const GAME_SOCKET_MAX_RETRIES = 5;
const defaultBackoff = (attempt: number) => Math.min(500 * 2 ** (attempt - 1), 8000);

/** `https://api.x` -> `wss://api.x/ws/games/1`; a relative base (dev proxy) uses the page origin. */
export function toWebSocketUrl(apiBase: string, socketPath: string): string {
  const base = apiBase.replace(/\/+$/, "");
  return `${base.replace(/^http/i, "ws")}${socketPath}`;
}

/** Plain browser WebSocket with bounded reconnect (backoff, max 5 tries) and seq-based resume. */
export function createGameSocket(options: GameSocketOptions) {
  const Impl = options.WebSocketImpl ?? WebSocket;
  const maxRetries = options.maxRetries ?? GAME_SOCKET_MAX_RETRIES;
  const backoff = options.backoffMs ?? defaultBackoff;
  let socket: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  let closedByUs = false;

  function connect() {
    options.onStatus(attempt === 0 ? "connecting" : "reconnecting", attempt);
    const current = new Impl(options.url);
    socket = current;
    current.onopen = () => {
      if (socket !== current) return;
      attempt = 0;
      options.onStatus("open", 0);
      current.send(JSON.stringify({ type: "resume", data: { lastSeq: options.getLastSeq() } } satisfies ClientMessage));
    };
    current.onmessage = (event) => {
      if (socket !== current || typeof event.data !== "string") return;
      try {
        options.onMessage(JSON.parse(event.data) as ServerMessage);
      } catch {
        // A malformed frame must not take the game down; the next state message re-syncs.
      }
    };
    current.onclose = () => {
      if (socket !== current || closedByUs) return;
      socket = null;
      if (attempt >= maxRetries) {
        options.onStatus("failed", attempt);
        return;
      }
      attempt += 1;
      options.onStatus("reconnecting", attempt);
      timer = setTimeout(connect, backoff(attempt));
    };
  }

  connect();

  return {
    /** False when the socket is not open (the caller keeps buttons locked in that case). */
    send(message: ClientMessage): boolean {
      if (!socket || socket.readyState !== Impl.OPEN) return false;
      socket.send(JSON.stringify(message));
      return true;
    },
    /** "Thử lại ngay": restart the retry budget and connect now. */
    retryNow() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (socket && socket.readyState === Impl.OPEN) return;
      attempt = 0;
      socket?.close();
      socket = null;
      connect();
    },
    close() {
      closedByUs = true;
      if (timer) clearTimeout(timer);
      socket?.close();
      socket = null;
    },
  };
}
