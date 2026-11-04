import {
  PlayerShellRuntime,
  type PlayerShellProps,
} from "@/features/lcms/quiz/player/player-shell-runtime";

export function PlayerShell(props: PlayerShellProps) {
  return <PlayerShellRuntime {...props} />;
}

export type { PlayerShellProps };
