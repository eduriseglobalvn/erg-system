import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ThumbUpOffAltRoundedIcon from "@mui/icons-material/ThumbUpOffAltRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgErrorState, ErgStatusChip } from "@/components/erg-mui";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ContentPendingSkeleton } from "@/routes/route-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { loadQuestionThread, questionThreadKeys, sendQuestionThreadMessage, type QuestionThread } from "../api/student-question-thread-api";
import { Composer, MessageList, QuestionCard } from "./student-question-thread-parts";

export const THANKS_MESSAGE = "Em cảm ơn cô ạ!";

type ThreadPaneProps = {
  accountId: string;
  threadId: string;
  mobile: boolean;
  /** The assignment of the thread is a PRACTICE one: it can be redone, so "Làm lại câu N" is offered. */
  practice: boolean;
  onBack?: () => void;
  onOpenAssignment?: (assignmentId: string) => void;
};

const teacherInitials = (name: string | null) => (name ?? "Giáo viên").split(/\s+/).filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase();

/** Right column of H12 / screen H12m: one question thread with the teacher. */
export function StudentQuestionThreadPane({ accountId, threadId, mobile, practice, onBack, onOpenAssignment }: ThreadPaneProps) {
  const queryClient = useQueryClient();
  const key = questionThreadKeys.detail(accountId, threadId);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => loadQuestionThread(threadId, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const send = useMutation({
    mutationFn: (message: string) => sendQuestionThreadMessage(threadId, message),
    onSuccess: (thread: QuestionThread) => {
      queryClient.setQueryData(key, thread);
      void queryClient.invalidateQueries({ queryKey: questionThreadKeys.list(accountId) });
    },
  });
  const thread = query.data;
  const lastFromTeacher = thread ? thread.messages.at(-1)?.mine === false : false;
  const openAssignment = thread && onOpenAssignment ? () => onOpenAssignment(thread.assignmentId) : undefined;

  if (query.isPending) return <ContentPendingSkeleton />;
  if (query.isError || !thread) {
    return <Box sx={{ p: 2 }}><ErgErrorState title="Không tải được cuộc trò chuyện" description="Kiểm tra kết nối rồi thử lại." action={<ErgButton variant="outlined" onClick={() => void query.refetch()}>Thử lại</ErgButton>} /></Box>;
  }
  const name = thread.teacherName ? `Cô ${thread.teacherName}` : "Giáo viên";
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: mobile ? 0 : 1, borderColor: "divider" }}>
        {onBack ? <IconButton aria-label="Quay lại Hộp thư" onClick={onBack}><ArrowBackRoundedIcon /></IconButton> : null}
        <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 40, height: 40, flexShrink: 0, borderRadius: "50%", bgcolor: t.statusTint.success.bg, color: t.statusTint.success.color }}>
          <Typography variant="subtitle2">{teacherInitials(thread.teacherName)}</Typography>
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" noWrap>{name}</Typography>
          <Typography variant="caption" noWrap sx={{ display: "block", color: "text.secondary" }}>{[thread.subjectName, mobile ? null : thread.className].filter(Boolean).join(" · ")}</Typography>
        </Box>
        {thread.status === "ANSWERED" && !mobile ? <ErgStatusChip label="Đã trả lời" tone="success" /> : null}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", alignContent: "start", gap: 1.5, p: 2 }}>
        <QuestionCard thread={thread} onOpen={openAssignment} />
        <MessageList messages={thread.messages} teacherInitials={teacherInitials(thread.teacherName)} />
        {lastFromTeacher ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pl: 4.5 }}>
            {practice && openAssignment ? (
              <Chip icon={<ReplayRoundedIcon />} label={`Làm lại câu ${thread.questionIndex}`} onClick={openAssignment} variant="outlined" color="primary" />
            ) : null}
            <Chip icon={<ThumbUpOffAltRoundedIcon />} label="Cảm ơn cô" disabled={send.isPending} onClick={() => send.mutate(THANKS_MESSAGE)} variant="outlined" />
          </Box>
        ) : null}
        {send.isError ? <Typography role="alert" variant="caption" color="error">Chưa gửi được tin nhắn. Thử lại nhé.</Typography> : null}
      </Box>
      <Composer mobile={mobile} disabled={send.isPending} onSend={(text) => send.mutate(text)} />
    </Box>
  );
}
