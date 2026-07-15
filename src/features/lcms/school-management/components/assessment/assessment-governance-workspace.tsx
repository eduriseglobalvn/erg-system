import ApprovalRoundedIcon from "@mui/icons-material/ApprovalRounded";
import AutoDeleteRoundedIcon from "@mui/icons-material/AutoDeleteRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LockClockRoundedIcon from "@mui/icons-material/LockClockRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { assessmentCampaigns, questionPermissionRequests } from "@/features/lcms/school-management/api/mock-training-monitoring";
import type { QuestionPermissionRequest } from "@/features/lcms/school-management/types/training-monitoring-types";

const campaignStatus = { scheduled: { label: "Sắp diễn ra", color: "info" }, open: { label: "Đang mở", color: "success" }, closed: { label: "Đã đóng", color: "default" } } as const;
const requestStatus = { pending: { label: "Chờ duyệt", color: "warning" }, approved: { label: "Đã cấp quyền", color: "success" }, rejected: { label: "Từ chối", color: "error" } } as const;

export function AssessmentGovernanceWorkspace() {
  const [tab, setTab] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [requests, setRequests] = useState(questionPermissionRequests);

  function updateRequest(id: string, status: QuestionPermissionRequest["status"]) {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
  }

  return <Box>
    <Paper variant="outlined" sx={{ mb: 1.5, overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" } }}>
        <WorkflowStep index="01" title="Chọn nguồn đề" note="PĐT tạo sẵn hoặc GV xin quyền" />
        <WorkflowStep index="02" title="Nhập câu hỏi" note="Bắt buộc từ Excel/CSV mẫu" />
        <WorkflowStep index="03" title="Đặt khung giờ" note="Mở và khóa bài tự động" />
        <WorkflowStep index="04" title="Đóng & dọn dữ liệu" note="Thu bài, xóa câu hỏi tạm" last />
      </Box>
    </Paper>

    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }, mb: 1.5 }}>
      <Metric icon={<QuizRoundedIcon />} label="Đợt kiểm tra" value={assessmentCampaigns.length} color="primary.main" />
      <Metric icon={<LockClockRoundedIcon />} label="Đang trong khung giờ" value={assessmentCampaigns.filter((item) => item.status === "open").length} color="success.main" />
      <Metric icon={<ApprovalRoundedIcon />} label="Yêu cầu chờ duyệt" value={requests.filter((item) => item.status === "pending").length} color="warning.main" />
      <Metric icon={<AutoDeleteRoundedIcon />} label="Bộ câu hỏi tự xóa" value={assessmentCampaigns.filter((item) => item.autoDeleteQuestions).length} color="info.main" />
    </Box>

    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ alignItems: { xs: "stretch", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1, justifyContent: "space-between", px: 1.5, py: 1.25 }}>
        <Box><Typography sx={{ fontWeight: 850 }}>Quản trị kiểm tra & câu hỏi tạm</Typography><Typography color="text.secondary" variant="caption">Mọi câu hỏi do giáo viên bổ sung đều có quyền, nguồn file và thời hạn sử dụng.</Typography></Box>
        <Button onClick={() => setImportOpen(true)} startIcon={<CloudUploadRoundedIcon />} variant="contained">Nhập câu hỏi từ file</Button>
      </Box>
      <Tabs onChange={(_, value: number) => setTab(value)} value={tab} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: "1px solid", borderColor: "divider", minHeight: 44, px: 1 }}><Tab label="Đợt kiểm tra" sx={{ minHeight: 44 }} /><Tab label={`Yêu cầu cấp quyền (${requests.filter((item) => item.status === "pending").length})`} sx={{ minHeight: 44 }} /><Tab label="Quy tắc dữ liệu" sx={{ minHeight: 44 }} /></Tabs>
      {tab === 0 ? <CampaignTable /> : null}
      {tab === 1 ? <RequestTable requests={requests} onUpdate={updateRequest} /> : null}
      {tab === 2 ? <DataRules /> : null}
    </Paper>
    <QuestionImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
  </Box>;
}

function WorkflowStep({ index, last = false, note, title }: { index: string; last?: boolean; note: string; title: string }) {
  return <Box sx={{ borderBottom: { xs: last ? 0 : "1px solid", md: 0 }, borderColor: "divider", borderRight: { md: last ? 0 : "1px solid" }, p: 1.5 }}><Typography color="primary.main" sx={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 900 }}>{index}</Typography><Typography sx={{ fontSize: 13.5, fontWeight: 850, mt: 0.25 }}>{title}</Typography><Typography color="text.secondary" variant="caption">{note}</Typography></Box>;
}

function Metric({ color, icon, label, value }: { color: string; icon: ReactNode; label: string; value: number }) {
  return <Paper variant="outlined" sx={{ p: 1.5 }}><Box sx={{ color }}>{icon}</Box><Typography sx={{ color, fontSize: 25, fontWeight: 900, mt: 0.5 }}>{value}</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{label}</Typography></Paper>;
}

function CampaignTable() {
  return <TableContainer sx={{ maxHeight: 520 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Bộ kiểm tra</TableCell><TableCell>Phạm vi</TableCell><TableCell>Nguồn tạo</TableCell><TableCell>Câu hỏi</TableCell><TableCell>Khung giờ</TableCell><TableCell>Tự xóa</TableCell><TableCell>Trạng thái</TableCell></TableRow></TableHead><TableBody>{assessmentCampaigns.map((item) => { const meta = campaignStatus[item.status]; return <TableRow hover key={item.id}><TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{item.title}</Typography><Typography color="text.secondary" variant="caption">{item.subject} · {item.owner}</Typography></TableCell><TableCell>{item.classScope}</TableCell><TableCell><Chip color={item.source === "training" ? "primary" : "default"} label={item.source === "training" ? "PĐT tạo sẵn" : "Giáo viên tạo"} size="small" variant="outlined" /></TableCell><TableCell>{item.questionCount}</TableCell><TableCell>{item.timeWindow}</TableCell><TableCell>{item.autoDeleteQuestions ? <Chip color="warning" icon={<AutoDeleteRoundedIcon />} label="Sau khi thu bài" size="small" variant="outlined" /> : "Lưu ngân hàng"}</TableCell><TableCell><Chip color={meta.color} label={meta.label} size="small" /></TableCell></TableRow>; })}</TableBody></Table></TableContainer>;
}

function RequestTable({ onUpdate, requests }: { onUpdate: (id: string, status: QuestionPermissionRequest["status"]) => void; requests: QuestionPermissionRequest[] }) {
  return <TableContainer sx={{ maxHeight: 520 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Giáo viên</TableCell><TableCell>Mục đích</TableCell><TableCell>Yêu cầu lúc</TableCell><TableCell>Quyền hết hạn</TableCell><TableCell>Trạng thái</TableCell><TableCell align="right">Xử lý</TableCell></TableRow></TableHead><TableBody>{requests.map((item) => { const meta = requestStatus[item.status]; return <TableRow hover key={item.id}><TableCell><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{item.teacher}</Typography><Typography color="text.secondary" variant="caption">{item.subject}</Typography></TableCell><TableCell>{item.purpose}</TableCell><TableCell>{item.requestedAt}</TableCell><TableCell>{item.expiresAt}</TableCell><TableCell><Chip color={meta.color} label={meta.label} size="small" /></TableCell><TableCell align="right">{item.status === "pending" ? <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}><Button color="inherit" onClick={() => onUpdate(item.id, "rejected")} size="small">Từ chối</Button><Button onClick={() => onUpdate(item.id, "approved")} size="small" variant="contained">Cấp quyền</Button></Box> : "—"}</TableCell></TableRow>; })}</TableBody></Table></TableContainer>;
}

function DataRules() {
  const rules = [
    ["Nguồn câu hỏi", "Không cho nhập tay trực tiếp. Giáo viên phải dùng file Excel/CSV theo mẫu để có dấu vết nguồn dữ liệu."],
    ["Quyền bổ sung", "Quyền chỉ có hiệu lực theo môn, mục đích và thời điểm được phòng đào tạo phê duyệt."],
    ["Khung giờ kiểm tra", "Câu hỏi tạm chỉ được phân phối trong thời gian mở bài; học sinh hết giờ sẽ được nộp tự động."],
    ["Dọn dữ liệu", "Với bộ đề tạm, hệ thống xóa nội dung câu hỏi sau khi toàn bộ bài làm đã được khóa và lưu kết quả."],
  ];
  return <Box sx={{ display: "grid", gap: 1, p: 2 }}>{rules.map(([title, body], index) => <Box key={title} sx={{ alignItems: "flex-start", bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 1.5, display: "grid", gap: 1.25, gridTemplateColumns: "28px minmax(0,1fr)", p: 1.5 }}><Typography color="primary.main" sx={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 900 }}>{String(index + 1).padStart(2, "0")}</Typography><Box><Typography sx={{ fontSize: 13.5, fontWeight: 850 }}>{title}</Typography><Typography color="text.secondary" variant="body2">{body}</Typography></Box></Box>)}</Box>;
}

function QuestionImportDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  const [fileName, setFileName] = useState("");
  return <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}><DialogTitle sx={{ pr: 6 }}><Typography sx={{ fontSize: 18, fontWeight: 900 }}>Nhập câu hỏi từ file</Typography><Typography color="text.secondary" variant="body2">Bắt buộc dùng Excel hoặc CSV theo mẫu đã kiểm soát.</Typography><IconButton aria-label="Đóng" onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}><CloseRoundedIcon /></IconButton></DialogTitle><DialogContent><Paper variant="outlined" sx={{ bgcolor: "background.default", borderStyle: "dashed", p: 3, textAlign: "center" }}><CloudUploadRoundedIcon color="primary" sx={{ fontSize: 34 }} /><Typography sx={{ fontWeight: 850, mt: 1 }}>{fileName || "Chưa chọn file câu hỏi"}</Typography><Typography color="text.secondary" sx={{ mb: 2 }} variant="caption">Cột bắt buộc: Loại câu hỏi, Nội dung, Đáp án, Chủ đề, Độ khó</Typography><Button component="label" variant="outlined">Chọn file Excel/CSV<input hidden accept=".xlsx,.xls,.csv" type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} /></Button></Paper><Box sx={{ bgcolor: "warning.50", border: "1px solid", borderColor: "warning.200", borderRadius: 1.5, mt: 2, p: 1.5 }}><Typography sx={{ fontSize: 13, fontWeight: 850 }}>Kiểm tra quyền trước khi nhập</Typography><Typography color="text.secondary" variant="body2">File chỉ được preview khi giáo viên có yêu cầu đã duyệt và còn hiệu lực. Phòng đào tạo xác nhận lần cuối trước khi ghi dữ liệu.</Typography></Box></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={onClose}>Hủy</Button><Button disabled={!fileName} variant="contained">Đọc file & xem trước</Button></DialogActions></Dialog>;
}
