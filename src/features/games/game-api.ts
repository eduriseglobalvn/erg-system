import type { RoomSummary } from "@/features/games/game-types";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";

/** Student: trade the 4-digit code for a room id. 404 wrong code, 403 not in the class. */
export function joinGameRoom(code: string) {
  return apiRequest<{ roomId: string }>(API_ENDPOINTS.games.roomJoin, {
    method: "POST",
    body: JSON.stringify({ code }),
    portal: "elearning",
  });
}

export function fetchGameRoom(roomId: string) {
  return apiRequest<RoomSummary>(API_ENDPOINTS.games.room(roomId), { portal: "elearning" });
}
