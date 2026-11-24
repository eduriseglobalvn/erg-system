import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { createGameRoom, fetchGameSources } from "@/features/games/game-api";
import { PickerStep } from "@/features/games/teacher/picker-step";
import { buildCreateRoomBody, DEFAULT_SETTINGS, pickSource, validateSettings, type RoomSettings } from "@/features/games/teacher/room-settings";
import { SettingsStep } from "@/features/games/teacher/settings-step";
import { shellSelectedClassId, useTeacherClasses } from "@/features/games/teacher/use-teacher-classes";
import { ApiClientError } from "@/lib/api-client";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

function createErrorMessage(error: unknown) {
  if (error instanceof ApiClientError && error.status === 403) return "Bạn không có quyền mở phòng cho lớp này.";
  if (error instanceof ApiClientError && error.status === 400) return "Cài đặt phòng chưa hợp lệ. Kiểm tra lại bài và thời lượng.";
  return "Không tạo được phòng. Kiểm tra mạng rồi thử lại.";
}

/** /teacher/games/new?quizId=...: pick the game, then the room settings; POST /rooms and open the control room. */
export function CreateRoomPage({ quizId, classId: initialClassId }: { quizId?: string; classId?: string }) {
  const navigate = useNavigate();
  const { classes } = useTeacherClasses();
  const [step, setStep] = useState<"pick" | "settings">("pick");
  const [draft, setDraft] = useState<RoomSettings>({ ...DEFAULT_SETTINGS, classId: initialClassId ?? "" });
  // Default: the class open in the shell switcher, when it is one of this teacher's classes.
  const [shellClassId] = useState(shellSelectedClassId);
  const classId = draft.classId || (classes.some((c) => c.id === shellClassId) ? shellClassId : classes[0]?.id) || "";
  const sources = useQuery({ queryKey: ["games", "sources", classId], queryFn: () => fetchGameSources(classId || undefined), staleTime: 60_000 });
  const source = pickSource(sources.data ?? [], quizId);
  // A class with no wrong questions cannot play CLASS_WRONG: fall back to the whole quiz.
  const questionSet = source?.classWrongCount ? draft.questionSet : "ALL";
  const settings = { ...draft, classId, questionSet, quizVersionId: source?.quizVersionId ?? "" };
  const problem = validateSettings(settings, source);
  const create = useMutation({
    mutationKey: ["games", "create"],
    mutationFn: createGameRoom,
    meta: { silent: true }, // the form shows its own error line
    onSuccess: (room) => { void navigate({ href: teacherPath(`/games/${encodeURIComponent(room.id)}`) }); },
  });
  const back = () => { void navigate({ href: teacherPath("/homework/exercise-bank") }); };

  return step === "pick" ? (
    <PickerStep quizTitle={source?.title} source={source} loading={sources.isPending} onBack={back} onNext={() => setStep("settings")} />
  ) : (
    <SettingsStep
      settings={settings}
      classes={classes}
      source={source}
      problem={problem}
      failure={create.isError ? createErrorMessage(create.error) : null}
      busy={create.isPending}
      onChange={setDraft}
      onBack={() => setStep("pick")}
      onSubmit={() => { if (source && !problem) create.mutate(buildCreateRoomBody(settings, source)); }}
    />
  );
}
