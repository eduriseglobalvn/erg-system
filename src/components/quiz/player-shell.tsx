import {
  PlayerShellRuntime,
  type PlayerShellProps,
} from "@/components/quiz/player-shell-runtime";

export function PlayerShell(props: PlayerShellProps) {
  return <PlayerShellRuntime {...props} />;
}

export type { PlayerShellProps };
