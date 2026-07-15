import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Refresh,
  Search,
} from "@mui/icons-material";
import type { ClassroomSnapshot, AssignmentRun } from "@/features/lms/classroom/types/classroom-types";

interface HomeworkPanelProps {
  selectedClass?: ClassroomSnapshot;
  runs: AssignmentRun[];
  onAssign: () => void;
  onViewProgress: (runId: string) => void;
}

export function HomeworkPanel({
  selectedClass,
  runs,
  onAssign,
  onViewProgress,
}: HomeworkPanelProps) {
  return (
    <>
      <FilterBar
        primaryPlaceholder="Tìm kiếm theo tên bài"
        filters={["Môn học", "Học kỳ", "Trạng thái", "Loại bài", "Tính điểm", "Đối tượng giao"]}
        onAssign={onAssign}
      />
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <TableContainer sx={{ minWidth: 1180 }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, width: 72, color: "text.secondary" }}>STT</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Tên bài</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Môn học</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Loại bài</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Đối tượng</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Thời gian làm bài</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary" }}>Trạng thái</TableCell>
                <TableCell sx={{ width: 64 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {runs.map((assignment, index) => (
                <TableRow
                  key={assignment.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    cursor: "pointer",
                  }}
                  onClick={() => onViewProgress(assignment.id)}
                >
                  <TableCell sx={{ fontWeight: 500, color: "text.secondary", fontSize: 13 }}>
                    {String(index + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "primary.main",
                          "&:hover": { color: "primary.dark" },
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProgress(assignment.id);
                        }}
                      >
                        {assignment.title}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>
                        Công bố điểm tự động
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{assignment.subjectLabel}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                      {index % 2 === 0 ? "Kiểm tra đầu vào" : "Luyện tập"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedClass?.className ?? "Cả lớp"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
                      21/05/2026 10:{50 + index}<br />
                      28/05/2026 10:{50 + index}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={index > 3 ? "Đã kết thúc" : "Đang diễn ra"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: 1.5,
                        bgcolor: index > 3 ? "error.light" : "success.light",
                        color: index > 3 ? "error.dark" : "success.dark",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProgress(assignment.id);
                      }}
                      sx={{
                        borderRadius: 1.5,
                        color: "text.secondary",
                        "&:hover": {
                          bgcolor: "action.selected",
                          color: "text.primary",
                        },
                      }}
                    >
                      <MoreVert sx={{ fontSize: 20 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </>
  );
}

function FilterBar({
  filters,
  primaryPlaceholder,
  onAssign,
}: {
  filters: string[];
  primaryPlaceholder: string;
  onAssign: () => void;
}) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        p: 2,
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr auto" },
          gap: 2,
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ gap: 1.5, flexWrap: "wrap" }}>
          {/* Search */}
          <TextField
            placeholder={primaryPlaceholder}
            size="small"
            sx={{
              minWidth: 240,
              maxWidth: 520,
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "background.paper",
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 20, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Filter selects */}
          {filters.map((filter) => (
            <Select
              key={filter}
              size="small"
              displayEmpty
              sx={{
                minWidth: 128,
                height: 40,
                borderRadius: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              renderValue={(value) => (
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
                  {(value as string) || filter}
                </Typography>
              )}
            >
              <MenuItem value="">{filter}</MenuItem>
            </Select>
          ))}

          {/* Reset */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            sx={{
              height: 40,
              borderRadius: 2,
              borderColor: "divider",
              color: "text.primary",
              fontWeight: 600,
              fontSize: 13,
              textTransform: "none",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "primary.light",
              },
            }}
          >
            Đặt lại
          </Button>
        </Stack>

        {/* Assign button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 18 }} />}
            onClick={onAssign}
            sx={{
              minWidth: 88,
              height: 40,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: 14,
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            }}
          >
            Giao bài
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
