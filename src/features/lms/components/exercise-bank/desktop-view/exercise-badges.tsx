import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { difficultyLabels, statusLabels, type ExerciseDifficulty, type ExerciseStatus } from "../exercise-bank-model";

export function DifficultyBadge({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const tones = { easy: "success", medium: "warning", hard: "error" } as const satisfies Record<ExerciseDifficulty, string>;

  return <ErgStatusChip dot={false} tone={tones[difficulty]} label={difficultyLabels[difficulty]} sx={{ borderRadius: 0.75 }} />;
}

export function StatusIndicator({ status }: { status: ExerciseStatus }) {
  const tones = { published: "success", draft: "warning", archived: "neutral" } as const satisfies Record<ExerciseStatus, string>;

  return <ErgStatusChip tone={tones[status]} label={statusLabels[status]} />;
}
