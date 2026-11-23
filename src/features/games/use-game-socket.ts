import { Store } from "@tanstack/store";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { ClientMessage } from "@/features/games/game-types";
import { createGameSocket, toWebSocketUrl } from "@/features/games/game-socket";
import { applyServerMessage, initialRoomViewState, type RoomViewState } from "@/features/games/room-state";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { getApiBase } from "@/lib/platform";

/** Realtime room state: native WebSocket in, TanStack Store out (no Query for the live stream). */
export function useGameSocket(roomId: string) {
  // One store per mounted room; the page remounts (key=roomId) when the room changes.
  const [store] = useState(() => new Store<RoomViewState>(initialRoomViewState));
  const socketRef = useRef<ReturnType<typeof createGameSocket> | null>(null);

  useEffect(() => {
    const socket = createGameSocket({
      url: toWebSocketUrl(getApiBase(), API_ENDPOINTS.games.socket(roomId)),
      getLastSeq: () => store.get().lastSeq,
      onMessage: (message) => store.setState((prev) => applyServerMessage(prev, message, Date.now())),
      onStatus: (connection, attempt) =>
        store.setState((prev) => ({
          ...prev,
          connection,
          attempt,
          droppedAtMs: connection === "open" ? null : (prev.droppedAtMs ?? (connection === "reconnecting" ? Date.now() : null)),
        })),
    });
    socketRef.current = socket;
    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, store]);

  const state = useSyncExternalStore(
    useCallback((notify) => { const sub = store.subscribe(notify); return () => sub.unsubscribe(); }, [store]),
    () => store.get(),
    () => store.get(),
  );
  const send = useCallback((message: ClientMessage) => socketRef.current?.send(message) ?? false, []);
  const retryNow = useCallback(() => socketRef.current?.retryNow(), []);
  return { state, send, retryNow };
}
