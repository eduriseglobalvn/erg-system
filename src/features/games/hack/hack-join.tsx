import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { joinGameRoom } from "@/features/games/game-api";
import { JoinScreen } from "@/features/games/hack/screens/join-screen";
import { useHackPhone } from "@/features/games/hack/ui/hack-ui";
import { ApiClientError } from "@/lib/api-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { studentPath } from "@/platform/workspaces/workspace-paths";

function joinErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    if (error.status === 404) return "Sai mã hoặc phòng đã đóng.";
    if (error.status === 403) return "Bạn không thuộc lớp của phòng này.";
    if (error.status === 429) return "Thử sai quá nhiều lần. Đợi một lát rồi nhập lại.";
  }
  return "Không kết nối được. Kiểm tra mạng rồi thử lại.";
}

/** 01 · Nhập mã phòng: trade the 4-digit code for a room id, then open the room. */
export function HackJoin() {
  const phone = useHackPhone();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const join = useMutation({
    mutationKey: ["games", "join"],
    mutationFn: joinGameRoom,
    meta: { silent: true }, // the screen shows its own error line
    onSuccess: ({ roomId }) => { void navigate({ href: studentPath(`/games/${encodeURIComponent(roomId)}`) }); },
    onError: (failure) => setError(joinErrorMessage(failure)),
  });

  return (
    <JoinScreen
      phone={phone}
      studentName={getCurrentAccount()?.fullName ?? null}
      busy={join.isPending}
      error={error}
      onSubmit={(code) => { setError(null); join.mutate(code); }}
    />
  );
}
