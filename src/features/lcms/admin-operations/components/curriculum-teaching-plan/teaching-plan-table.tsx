import ArrowDownward from "@mui/icons-material/ArrowDownward";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ContentPaste from "@mui/icons-material/ContentPaste";
import CreateNewFolder from "@mui/icons-material/CreateNewFolder";
import Delete from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { EditableCurriculumRow, TopicGroup } from "./types";

export function TeachingPlanTable({
  subject,
  selectedStage,
  academicYear,
  rows,
  topicGroups,
  selectedTopic,
  setSelectedTopic,
  updateTopicGroup,
  updateRow,
  removeTopicGroup,
  moveRow,
  removeRow,
  addNewTopic,
  setImportDialogOpen,
}: {
  subject?: StudioSubject;
  selectedStage?: CurriculumRoadmapStage;
  academicYear: string;
  rows: EditableCurriculumRow[];
  topicGroups: TopicGroup[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  updateTopicGroup: (index: number, topic: string) => void;
  updateRow: (index: number, patch: Partial<EditableCurriculumRow>) => void;
  removeTopicGroup: (topicName: string, count: number) => void;
  moveRow: (index: number, direction: "up" | "down") => void;
  removeRow: (index: number) => void;
  addNewTopic: () => void;
  setImportDialogOpen: (open: boolean) => void;
}) {
  return (
    <Box sx={{ border: "1px solid", borderColor: "#D9E2EF", borderRadius: 2, overflow: "auto", maxHeight: 460, bgcolor: "white" }}>
      <Box
        component="table"
        sx={{
          width: "100%",
          minWidth: 860,
          borderCollapse: "collapse",
          color: "#1C252E",
          "th,td": { border: "1px solid #D9E2EF", px: 0.75, py: 0.5, textAlign: "left", fontSize: 12 },
          thead: { position: "sticky", top: 0, zIndex: 2 },
          "thead tr:first-of-type th": {
            bgcolor: "#FFFFFF",
            color: "#1C252E",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: "22px",
            py: 0.75,
            textAlign: "center",
          },
          "thead tr:nth-of-type(2) th": { bgcolor: "#FFFFFF", color: "#1C252E", fontSize: 14, fontWeight: 600, py: 0.5, textAlign: "center" },
          "thead tr:last-of-type th": { bgcolor: "#F4F6F8", color: "#52616F", fontWeight: 600, py: 0.75, textAlign: "center" },
        }}
      >
        <thead>
          <tr>
            <th colSpan={6}>KHUNG CHƯƠNG TRÌNH MÔN HỌC</th>
          </tr>
          <tr>
            <th colSpan={6}>
              {subject?.label ?? "Chưa chọn môn"} · {selectedStage?.level.title ?? "Chưa chọn level"} · Năm học {academicYear}
            </th>
          </tr>
          <tr>
            <th style={{ width: "24%" }}>Chủ đề</th>
            <th style={{ width: 62 }}>Tiết</th>
            <th>Tên bài học</th>
            <th style={{ width: 72 }}>Số tiết</th>
            <th style={{ width: 80 }}>Thứ tự</th>
            <th style={{ width: 56 }}>Xóa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const group = topicGroups.find((candidate) => index === candidate.start);
            const isGroupStart = Boolean(group);
            const isReview = row.title.toLowerCase().includes("ôn tập");
            const isPractice = row.title.toLowerCase().includes("luyện thi");
            const isNewlyAdded = Boolean(row.isNew);

            let rowBg = index % 2 === 0 ? "#FFFFFF" : "#FBFCFF";
            if (isNewlyAdded) {
              rowBg = "#FEF2F2";
            } else if (isReview) {
              rowBg = "#EBF3FC";
            } else if (isPractice) {
              rowBg = "#F5F3FF";
            }

            return (
              <tr
                key={row.id ?? `new-${index}`}
                style={{
                  backgroundColor: rowBg,
                  boxShadow: isNewlyAdded ? "inset 3px 0 0 #EF4444" : undefined,
                }}
              >
                {isGroupStart ? (
                  <td
                    rowSpan={group?.count}
                    style={{
                      verticalAlign: "middle",
                      backgroundColor: selectedTopic === row.topic ? "#F0F7FF" : "#FAFAFC",
                      borderLeft: selectedTopic === row.topic ? "3px solid #0071E3" : "1px solid #D9E2EF",
                      padding: "8px 8px",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => setSelectedTopic(row.topic)}
                  >
                    <Box sx={{ display: "grid", gap: 0.75 }}>
                      <TextField
                        size="small"
                        placeholder="Tên chủ đề..."
                        value={row.topic}
                        onChange={(event) => updateTopicGroup(index, event.target.value)}
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={3}
                        sx={{
                          "& .MuiInputBase-root": { bgcolor: "#FFFFFF", borderRadius: 1 },
                          "& .MuiInputBase-input": { fontSize: 12.5, fontWeight: 600, color: "#1E293B" },
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.25 }}>
                        <Chip
                          size="small"
                          label={`${group?.count || 1} tiết`}
                          sx={{
                            height: 20,
                            fontSize: 10.5,
                            fontWeight: 600,
                            bgcolor: selectedTopic === row.topic ? "#BFDBFE" : "#E2E8F0",
                            color: selectedTopic === row.topic ? "#1E40AF" : "#334155",
                          }}
                        />
                        <Tooltip title={`Xóa toàn bộ chủ đề "${row.topic}" (${group?.count} tiết)`}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTopicGroup(row.topic, group?.count || 1);
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </td>
                ) : null}
                <td style={{ textAlign: "center" }}>
                  <TextField
                    size="small"
                    type="number"
                    value={row.period}
                    onChange={(event) => updateRow(index, { period: Math.max(1, Number(event.target.value)) })}
                    sx={{ width: 58, "& input": { textAlign: "center", fontSize: 12 } }}
                  />
                </td>
                <td>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isNewlyAdded ? (
                      <Chip
                        size="small"
                        label="Chưa lưu"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 600,
                          bgcolor: "#FEE2E2",
                          color: "#B91C1C",
                          border: "1px solid #FECACA",
                        }}
                      />
                    ) : null}
                    {isReview ? (
                      <Chip size="small" label="Ôn tập" sx={{ height: 20, fontSize: 10, bgcolor: "#BFDBFE", color: "#1E40AF" }} />
                    ) : isPractice ? (
                      <Chip size="small" label="Luyện thi" sx={{ height: 20, fontSize: 10, bgcolor: "#DDD6FE", color: "#5B21B6" }} />
                    ) : null}
                    <TextField
                      size="small"
                      value={row.title}
                      onChange={(event) => updateRow(index, { title: event.target.value })}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-root": {
                          bgcolor: isNewlyAdded ? "#FFF5F5" : "transparent",
                        },
                        "& input": {
                          fontSize: 12.5,
                          fontWeight: isReview || isPractice || isNewlyAdded ? 600 : 400,
                          color: isNewlyAdded ? "#991B1B" : "#1C252E",
                        },
                      }}
                    />
                  </Box>
                </td>
                <td style={{ textAlign: "center" }}>
                  <TextField
                    size="small"
                    type="number"
                    value={row.sessions}
                    onChange={(event) => updateRow(index, { sessions: Math.max(1, Number(event.target.value)) })}
                    sx={{ width: 62, "& input": { textAlign: "center", fontSize: 12 } }}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 0.25 }}>
                    <Tooltip title="Chuyển lên">
                      <span>
                        <IconButton size="small" disabled={index === 0} onClick={() => moveRow(index, "up")} sx={{ p: 0.25 }}>
                          <ArrowUpward fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Chuyển xuống">
                      <span>
                        <IconButton size="small" disabled={index === rows.length - 1} onClick={() => moveRow(index, "down")} sx={{ p: 0.25 }}>
                          <ArrowDownward fontSize="inherit" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </td>
                <td style={{ textAlign: "center" }}>
                  <Tooltip title="Xóa dòng">
                    <IconButton size="small" color="error" onClick={() => removeRow(index)} sx={{ p: 0.5 }}>
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Box>
      {!rows.length ? (
        <Box sx={{ p: 4, textAlign: "center", display: "grid", gap: 1.5, placeItems: "center" }}>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            Level chưa có dòng khung chương trình. Bấm <strong>“Thêm chủ đề mới”</strong> hoặc <strong>“Nhập nhanh từ Excel”</strong> để bắt đầu.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CreateNewFolder />}
              onClick={() => addNewTopic()}
              sx={{ textTransform: "none", bgcolor: "#0071E3", fontWeight: 600 }}
            >
              Thêm chủ đề đầu tiên
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentPaste />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Nhập nhanh từ Excel
            </Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
