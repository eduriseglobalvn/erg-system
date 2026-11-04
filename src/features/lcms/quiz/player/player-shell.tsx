import { PlayerShellRuntime } from "@/features/lcms/quiz/player/player-shell-runtime";
import type { PlayerShellProps } from "@/features/lcms/quiz/player/player-shell-props";

export function PlayerShell(props: PlayerShellProps) {
  return <PlayerShellRuntime {...props} />;
}

export type { PlayerShellProps };
