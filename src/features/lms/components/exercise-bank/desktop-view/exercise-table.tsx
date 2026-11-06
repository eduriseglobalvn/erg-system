import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SendIcon from "@mui/icons-material/Send";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { typeLabels } from "../exercise-bank-model";
import type { ExerciseBankController } from "../use-exercise-bank-controller";
import { DifficultyBadge, StatusIndicator } from "./exercise-badges";

export function ExerciseTable({
  controller,
  onAssign,
  setDetailModalOpen,
}: {
  controller: ExerciseBankController;
  onAssign: (exerciseTitle: string) => void;
  setDetailModalOpen: (open: boolean) => void;
}) {
  const [menu, setMenu] = useState<{ anchor: HTMLElement; id: string } | null>(null);
  const menuExercise = controller.filteredExercises.find((item) => item.id === menu?.id);
  return (
    <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
      <ErgTable sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ px: 2 }}>Bài tập</TableCell>
            <TableCell sx={{ px: 1.75 }}>Môn & Cấp độ</TableCell>
            <TableCell sx={{ px: 1.5 }}>Phân loại</TableCell>
            <TableCell sx={{ px: 1.5 }}>Độ khó</TableCell>
            <TableCell sx={{ px: 1.5 }}>Thời lượng</TableCell>
            <TableCell sx={{ px: 1.5 }}>Trạng thái</TableCell>
            <TableCell sx={{ px: 2 }} align="right">Giao bài</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controller.filteredExercises.map((exercise) => {
            const isSelected = exercise.id === controller.selectedExercise.id;
            return (
              <TableRow
                key={exercise.id}
                hover
                selected={isSelected}
                onClick={() => controller.setSelectedExerciseId(exercise.id)}
                onDoubleClick={() => {
                  controller.setSelectedExerciseId(exercise.id);
                  setDetailModalOpen(true);
                }}
                sx={{
                  cursor: "pointer",
                  userSelect: "none",
                  "& > td:first-of-type": { borderLeft: 3, borderLeftColor: isSelected ? "primary.main" : "transparent" },
                }}
              >
                {/* Tiêu đề bài tập */}
                <TableCell sx={{ px: 2 }}>
                  <ButtonBase
                    onClick={(e) => {
                      e.stopPropagation();
                      controller.setSelectedExerciseId(exercise.id);
                      setDetailModalOpen(true);
                    }}
                    title="Bấm để xem danh sách câu hỏi"
                    sx={{
                      maxWidth: 320,
                      display: "-webkit-box",
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      textAlign: "left",
                      typography: "body2",
                      fontWeight: "fontWeightMedium",
                      color: "text.primary",
                      transition: "color 0.15s ease",
                      "&:hover": { color: "primary.main", textDecoration: "underline" },
                    }}
                  >
                    {exercise.title}
                  </ButtonBase>
                  <Typography variant="caption" component="div" sx={{ mt: 0.25, color: "text.secondary" }}>
                    {exercise.source === "teacher" ? "Giáo viên tạo" : "Hệ thống"}
                  </Typography>
                </TableCell>

                {/* Môn & Cấp độ */}
                <TableCell sx={{ px: 1.75, whiteSpace: "nowrap" }}>
                  <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>{exercise.subject}</Box>
                  <Typography variant="caption" component="span" sx={{ ml: 0.5, color: "text.secondary" }}>
                    • {exercise.level}
                  </Typography>
                </TableCell>

                {/* Phân loại */}
                <TableCell sx={{ px: 1.5, whiteSpace: "nowrap", color: "text.secondary", fontWeight: "fontWeightMedium" }}>
                  {typeLabels[exercise.type]}
                </TableCell>

                {/* Độ khó */}
                <TableCell sx={{ px: 1.5, whiteSpace: "nowrap" }}>
                  <DifficultyBadge difficulty={exercise.difficulty} />
                </TableCell>

                {/* Thời lượng */}
                <TableCell sx={{ px: 1.5, whiteSpace: "nowrap" }}>
                  <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>{exercise.durationMinutes} phút</Box>
                  <Box component="span" sx={{ mx: 0.5, color: "text.disabled" }}>•</Box>
                  <Box component="span" sx={{ color: "text.secondary" }}>{exercise.questionCount} câu</Box>
                </TableCell>

                {/* Trạng thái */}
                <TableCell sx={{ px: 1.5, whiteSpace: "nowrap" }}>
                  <StatusIndicator status={exercise.status} />
                </TableCell>

                {/* Nút hành động */}
                <TableCell sx={{ px: 2, whiteSpace: "nowrap" }} align="right">
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <ErgButton
                      leadingIcon={<SendIcon />}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAssign(exercise.title);
                      }}
                      size="small"
                      variant="outlined"
                    >
                      Giao
                    </ErgButton>
                    <ErgIconButton
                      label="Thao tác khác"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenu({ anchor: event.currentTarget, id: exercise.id });
                      }}
                    >
                      <MoreHorizIcon />
                    </ErgIconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </ErgTable>
      <Menu anchorEl={menu?.anchor} onClose={() => setMenu(null)} open={Boolean(menu && menuExercise)}>
        <MenuItem
          onClick={() => {
            if (menuExercise) controller.openEditDialog(menuExercise);
            setMenu(null);
          }}
        >
          Sửa bài tập
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuExercise) controller.setSelectedExerciseId(menuExercise.id);
            setDetailModalOpen(true);
            setMenu(null);
          }}
        >
          Xem câu hỏi
        </MenuItem>
      </Menu>


      {controller.filteredExercises.length === 0 ? (
        <Typography variant="caption" component="div" sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Không tìm thấy bài tập phù hợp. Thử đổi từ khóa hoặc đặt lại bộ lọc.
        </Typography>
      ) : null}
    </Box>
  );
}
