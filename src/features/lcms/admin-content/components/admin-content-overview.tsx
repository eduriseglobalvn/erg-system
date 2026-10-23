import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

import { ADMIN_CONTENT_SECTIONS, type AdminContentSectionKey } from "../admin-content-route";

const ICONS: Record<AdminContentSectionKey, typeof FolderRoundedIcon> = {
  structure: AccountTreeRoundedIcon,
  resources: FolderRoundedIcon,
  "quiz-bank": QuizRoundedIcon,
  questions: HelpOutlineRoundedIcon,
  "quiz-editor": ArticleRoundedIcon,
};

const DESCRIPTIONS: Record<AdminContentSectionKey, string> = {
  structure: "Quản lý môn học, level, chủ đề, phân phối chương trình và vị trí nội dung hiển thị trên LMS.",
  resources: "Taxonomy, tài liệu, metadata và trạng thái xuất bản dùng chung cho các lớp học.",
  "quiz-bank": "Quản lý các gói bài tập để giáo viên giao và theo dõi trong Teacher Workspace.",
  questions: "Tạo, rà soát và phân loại câu hỏi theo phạm vi được cấp quyền.",
  "quiz-editor": "Biên soạn quiz, slide, đáp án và cấu hình trải nghiệm làm bài.",
};

export function AdminContentOverview() {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 1200, mx: "auto", width: "100%" }}>
      <Box>
        <Typography color="text.primary" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800 }}>
          Nội dung
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
          Một nơi cho toàn bộ học liệu và công cụ authoring của ERG. Quyền truy cập vẫn được kiểm tra ở backend.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        {ADMIN_CONTENT_SECTIONS.map((section) => {
          const Icon = ICONS[section.key];
          return (
            <Card key={section.key} variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", p: 2.5 }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <Box sx={{ bgcolor: "primary.50", borderRadius: 1.5, color: "primary.main", display: "grid", p: 1, placeItems: "center" }}>
                    <Icon fontSize="small" />
                  </Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 750 }}>{section.label}</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>
                  {DESCRIPTIONS[section.key]}
                </Typography>
                <Button
                  onClick={() => void navigate({ href: section.canonicalPath })}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                  variant="outlined"
                >
                  Mở {section.label.toLocaleLowerCase("vi-VN")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
