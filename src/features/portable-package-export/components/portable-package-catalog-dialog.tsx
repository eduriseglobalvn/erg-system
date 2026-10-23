import { useState } from "react";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import { useQuizEditorWorkspaceQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorApiPortal, QuizEditorSummary } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { PortablePackageExportDialog } from "@/features/portable-package-export/components/portable-package-export-dialog";

export function PortablePackageCatalogDialog({ onClose, portal }: { onClose: () => void; portal: QuizEditorApiPortal }) {
  const [selected, setSelected] = useState<QuizEditorSummary | null>(null);
  const query = useQuizEditorWorkspaceQuery({ page: 0, portal, size: 50, status: "published" });
  const quizzes = (query.data?.quizzes.items ?? []).filter((quiz) => quiz.status === "published" || Boolean(quiz.currentVersionLabel));

  if (selected) {
    return (
      <PortablePackageExportDialog
        onClose={() => setSelected(null)}
        open
        portal={portal}
        quiz={selected}
      />
    );
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="portable-catalog-title">
      <DialogTitle id="portable-catalog-title">
        <Typography component="span" sx={{ display: "block", fontSize: 20, fontWeight: 850 }}>Đề có thể đóng gói</Typography>
        <Typography component="span" color="text.secondary" sx={{ display: "block", fontSize: 13.5, mt: 0.5 }}>Chọn một phiên bản đã xuất bản từ kho nội dung thật.</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {query.isLoading ? (
          <List>{Array.from({ length: 5 }).map((_, index) => <ListItem key={index}><Skeleton height={52} variant="rounded" width="100%" /></ListItem>)}</List>
        ) : query.isError ? (
          <Typography color="error" sx={{ p: 3 }}>Không thể tải danh sách đề. Vui lòng kiểm tra quyền lms.quiz.read và kết nối API.</Typography>
        ) : quizzes.length ? (
          <List disablePadding>
            {quizzes.map((quiz) => (
              <ListItemButton divider key={quiz.id} onClick={() => setSelected(quiz)} sx={{ px: 2.5, py: 1.5 }}>
                <Inventory2RoundedIcon color="primary" sx={{ mr: 1.5 }} />
                <ListItemText
                  primary={quiz.title}
                  secondary={`${quiz.currentVersionLabel ?? "Đã xuất bản"} · ${quiz.questionCount} câu hỏi`}
                  slotProps={{ primary: { sx: { fontWeight: 780 } }, secondary: { sx: { fontSize: 12.5, mt: 0.25 } } }}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ p: 4, textAlign: "center" }}>Chưa có đề đã xuất bản để đóng gói.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}
