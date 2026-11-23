import { useQuery } from "@tanstack/react-query";

import { formatDateVi } from "@/domain/formatters/format-date";
import { fetchGameSources } from "@/features/games/game-api";
import type { GameSource } from "@/features/games/game-types";
import { HACK_GAME_DISPLAY_NAME } from "@/features/games/hack/hack-tokens";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

/** True when the signed-in teacher may host games (lms.games.host). */
export function useCanHostGames() {
  const auth = useAuthSession("lms");
  return evaluatePermission({ permission: "lms.games.host", grantedPermissions: auth.session?.permissions, deniedPermissions: auth.session?.deniedPermissions });
}

/** "ERG Hack · 7A2 · 18/11", or "Chưa chơi". */
export function describeLastGame(lastGame: GameSource["lastGame"]): string {
  if (!lastGame) return "Chưa chơi";
  const day = formatDateVi(lastGame.endedAt).slice(0, 5); // dd/MM of dd/MM/yyyy
  return [HACK_GAME_DISPLAY_NAME, lastGame.className, day].filter(Boolean).join(" · ");
}

/** One GET /sources (no class) for a whole list; `lastGameOf(quizId)` is undefined until it loads or without the permission. */
export function useLastGames() {
  const allowed = useCanHostGames();
  const sources = useQuery({ queryKey: ["games", "sources", "all"], queryFn: () => fetchGameSources(), enabled: allowed, staleTime: 60_000, retry: 1 });
  const byQuiz = new Map<string, GameSource["lastGame"]>();
  for (const source of sources.data ?? []) if (source.lastGame || !byQuiz.has(source.quizId)) byQuiz.set(source.quizId, source.lastGame ?? null);
  return { allowed, lastGameLabel: (quizId: string) => (sources.data ? describeLastGame(byQuiz.get(quizId) ?? null) : "") };
}
