import { useMemo, useState } from "react";
import AutoFixHigh from "@mui/icons-material/AutoFixHigh";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ContentPaste from "@mui/icons-material/ContentPaste";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  parseCurriculumPastedText,
  type ParsedCurriculumItem,
} from "@/features/lcms/admin-operations/utils/curriculum-import-parser";

const SAMPLE_IC3_EXCEL_TEXT = `Chủ đề\tTiết\tTên bài học
Căn bản về công nghệ\t1\tBài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm
\t2\tBài 1: Xác định yêu cầu hệ thống và yêu cầu phần mềm
\t3\tBài 2: Khắc phục sự cố máy tính
\t4\tBài 2: Khắc phục sự cố máy tính
\t5\tBài 3: Cấp phép phần mềm
\t6\tBài 4: Cài đặt mặc định phần mềm
\t7\tÔn tập 1
Công dân số\t8\tBài 5: Báo cáo hành vi gây hại (1)
\t9\tBài 6: Báo cáo hành vi gây hại (2)
\t10\tBài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số
\t11\tBài 7: Một số hành vi bất hợp pháp trên môi trường kĩ thuật số
\t12\tBài 8: Cập nhật kiến thức kĩ thuật số (1)
\t13\tBài 9: Cập nhật kiến thức kĩ thuật số (2)
\t14\tÔn tập 2
Quản lý thông tin\t15\tBài 10: Thu hẹp phạm vi tìm kiếm (1)
\t16\tBài 10: Thu hẹp phạm vi tìm kiếm (1)
\t17\tBài 11: Thu hẹp phạm vi tìm kiếm (2)
\t18\tBài 12: Đánh giá thông tin (1)
\t19\tBài 13: Đánh giá thông tin (2)
\t20\tÔn tập 3
Tăng cường\t51\tÔn tập
\t52\tÔn tập
\t58\tLuyện thi
\t59\tLuyện thi
\t60\tLuyện thi`;

interface CurriculumExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (rows: ParsedCurriculumItem[]) => void;
  currentLevelTitle?: string;
}

export function CurriculumExcelImportDialog({
  open,
  onClose,
  onApply,
  currentLevelTitle,
}: CurriculumExcelImportDialogProps) {
  const [rawText, setRawText] = useState("");

  const parseResult = useMemo(() => {
    return parseCurriculumPastedText(rawText);
  }, [rawText]);

  function handleFillSample() {
    setRawText(SAMPLE_IC3_EXCEL_TEXT);
  }

  function handleApply() {
    if (!parseResult.rows.length) return;
    onApply(parseResult.rows);
    setRawText("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ContentPaste color="primary" />
          <Typography variant="h6" sx={{ fontSize: 18, fontWeight: 600 }}>
            Nhập nhanh từ Excel / Bảng tính
          </Typography>
        </Box>
        {currentLevelTitle ? (
          <Chip label={currentLevelTitle} size="small" color="primary" variant="outlined" />
        ) : null}
      </DialogTitle>

      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        <Alert severity="info" icon={<InfoOutlined fontSize="inherit" />} sx={{ py: 0.5, px: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            Mở file Excel của bạn, chọn các cột <strong>Chủ đề</strong>, <strong>Tiết</strong>, <strong>Tên bài học</strong> rồi nhấn <strong>Ctrl + C</strong> và dán vào ô bên dưới. Hệ thống tự nhận diện các ô merge và tiết ôn tập.
          </Typography>
        </Alert>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#2D3748" }}>
            Dán dữ liệu (Clipboard Paste)
          </Typography>
          <Button variant="contained"
            size="small"
            startIcon={<AutoFixHigh fontSize="small" />}
            onClick={handleFillSample}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Dán mẫu IC3 GS6 (ảnh 1 & 2)
          </Button>
        </Box>

        <TextField
          multiline
          minRows={8}
          maxRows={14}
          fullWidth
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Ví dụ sao chép từ Excel:\nChủ đề\tTiết\tTên bài học\nCăn bản về công nghệ\t1\tBài 1: Xác định yêu cầu\n\t2\tBài 1: Xác định yêu cầu (tt)\n\t3\tÔn tập 1`}
          sx={{
            "& .MuiInputBase-root": {
              fontFamily: "monospace",
              fontSize: 12.5,
              bgcolor: "#FAFAFA",
            },
          }}
        />

        {parseResult.rows.length > 0 ? (
          <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", display: "grid", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircle sx={{ color: "#16A34A", fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: "#15803D", fontWeight: 600 }}>
                Đã nhận diện thành công: {parseResult.stats.totalLessons} dòng
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={`${parseResult.stats.totalTopics} Chủ đề`}
                sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`${parseResult.stats.totalPeriods} Tổng tiết`}
                sx={{ bgcolor: "#E0F2FE", color: "#0369A1", fontWeight: 600 }}
              />
              {parseResult.stats.reviewCount > 0 ? (
                <Chip
                  size="small"
                  label={`${parseResult.stats.reviewCount} Tiết Ôn tập`}
                  sx={{ bgcolor: "#FEF3C7", color: "#B45309", fontWeight: 600 }}
                />
              ) : null}
              {parseResult.stats.practiceCount > 0 ? (
                <Chip
                  size="small"
                  label={`${parseResult.stats.practiceCount} Tiết Luyện thi`}
                  sx={{ bgcolor: "#F3E8FF", color: "#6B21A8", fontWeight: 600 }}
                />
              ) : null}
            </Box>

            <Typography variant="caption" sx={{ color: "#4B5563", mt: 0.5 }}>
              Xem trước 3 dòng đầu: {parseResult.rows.slice(0, 3).map((r) => `[${r.topic}] Tiết ${r.period}: ${r.title}`).join(" • ")}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button variant="contained" onClick={onClose} sx={{ textTransform: "none" }}>
          Hủy bỏ
        </Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={!parseResult.rows.length}
          sx={{ textTransform: "none", px: 2.5 }}
        >
          Áp dụng vào khung chương trình ({parseResult.rows.length} dòng)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
