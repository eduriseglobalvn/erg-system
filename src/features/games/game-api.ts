import type { CreateRoomBody, GameSource, RoomSummary } from "@/features/games/game-types";
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

// Teacher side (lms portal).
const lms = { portal: "lms" } as const;

/** With a classId the items also carry classSize and classWrongCount; lastGame is always there. */
export function fetchGameSources(classId?: string) {
  return apiRequest<GameSource[]>(classId ? `${API_ENDPOINTS.games.sources}?classId=${encodeURIComponent(classId)}` : API_ENDPOINTS.games.sources, lms);
}

export function createGameRoom(body: CreateRoomBody) {
  return apiRequest<RoomSummary>(API_ENDPOINTS.games.rooms, { ...lms, method: "POST", body: JSON.stringify(body) });
}

/** `status` is a comma list (LOBBY,RUNNING,...); omit for every room. */
export function fetchGameRooms(status?: string) {
  return apiRequest<RoomSummary[]>(status ? `${API_ENDPOINTS.games.rooms}?status=${encodeURIComponent(status)}` : API_ENDPOINTS.games.rooms, lms);
}

export function fetchGameRoomAsHost(roomId: string) {
  return apiRequest<RoomSummary>(API_ENDPOINTS.games.room(roomId), lms);
}
