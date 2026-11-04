import { cn } from "@/lib/utils";
import { difficultyLabels, statusLabels, type ExerciseDifficulty, type ExerciseStatus } from "../exercise-bank-model";

export function DifficultyBadge({ difficulty }: { difficulty: ExerciseDifficulty }) {
  const styles: Record<ExerciseDifficulty, string> = {
    easy: "bg-emerald-50 text-emerald-800 border-emerald-200",
    medium: "bg-amber-50 text-amber-800 border-amber-200",
    hard: "bg-rose-50 text-rose-800 border-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        styles[difficulty]
      )}
    >
      {difficultyLabels[difficulty]}
    </span>
  );
}

export function StatusIndicator({ status }: { status: ExerciseStatus }) {
  const configs: Record<ExerciseStatus, { dot: string; badge: string }> = {
    published: {
      dot: "bg-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    draft: {
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    archived: {
      dot: "bg-slate-400",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const config = configs[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {statusLabels[status]}
    </span>
  );
}
