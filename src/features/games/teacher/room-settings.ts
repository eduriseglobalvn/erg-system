import type { CreateRoomBody, GameSource, QuestionSet, RoomRules } from "@/features/games/game-types";

export const DURATION_MIN = 5;
export const DURATION_MAX = 30;

export type RoomSettings = {
  classId: string;
  quizVersionId: string;
  durationMinutes: number;
  questionSet: QuestionSet;
  showLeaderboard: boolean;
  showSolution: boolean;
  allowLateJoin: boolean;
  questionOrder: RoomRules["questionOrder"];
};

export const DEFAULT_SETTINGS: RoomSettings = {
  classId: "",
  quizVersionId: "",
  durationMinutes: 10,
  questionSet: "ALL",
  showLeaderboard: true,
  showSolution: true,
  allowLateJoin: true,
  questionOrder: "RANDOM",
};

export const clampDuration = (minutes: number) => Math.min(DURATION_MAX, Math.max(DURATION_MIN, Math.round(minutes) || DURATION_MIN));

/** Several versions of one quiz may be published: the newest is the one a room plays. */
export function pickSource(sources: GameSource[], quizId: string | undefined): GameSource | undefined {
  return sources.filter((source) => source.quizId === quizId).sort((a, b) => b.versionNumber - a.versionNumber)[0];
}

const KIND_LABELS: Record<string, string> = { essay: "tự luận", likert_scale: "thang đánh giá" };

/** "1 tự luận, 1 thang đánh giá" for the questions the room filter drops; "" when nothing is dropped. */
export function describeFiltered(filteredByKind: Record<string, number>): string {
  return Object.entries(filteredByKind)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${count} ${KIND_LABELS[kind] ?? kind}`)
    .join(", ");
}

/** The first problem that blocks "Tạo phòng", as a sentence for the teacher; null when the settings are valid. */
export function validateSettings(settings: RoomSettings, source: GameSource | undefined): string | null {
  if (!source) return "Chọn bài tập để chơi.";
  if (!settings.classId) return "Chọn lớp chơi.";
  if (settings.questionSet === "CLASS_WRONG" && !source.classWrongCount) return "Lớp này chưa có câu hay sai trong bài này.";
  if (source.playableCount <= 0) return "Bài này không có câu nào chơi được trong trò chơi.";
  if (!Number.isInteger(settings.durationMinutes) || settings.durationMinutes < DURATION_MIN || settings.durationMinutes > DURATION_MAX) {
    return `Thời lượng từ ${DURATION_MIN} đến ${DURATION_MAX} phút.`;
  }
  return null;
}

/** Wave 1 has no hack: allowHack and emergencyPatch are always sent as false, whatever the form holds. */
export function buildCreateRoomBody(settings: RoomSettings, source: GameSource): CreateRoomBody {
  return {
    gameType: "HACK",
    quizVersionId: source.quizVersionId,
    classId: settings.classId,
    durationMinutes: settings.durationMinutes,
    questionSet: settings.questionSet,
    rules: {
      allowHack: false,
      emergencyPatch: false,
      showLeaderboard: settings.showLeaderboard,
      showSolution: settings.showSolution,
      allowLateJoin: settings.allowLateJoin,
      questionOrder: settings.questionOrder,
    },
  };
}
