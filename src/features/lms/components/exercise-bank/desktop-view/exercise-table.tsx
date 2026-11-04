import { useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import SendIcon from "@mui/icons-material/Send";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { cn } from "@/lib/utils";
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
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 font-semibold text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Bài tập</th>
                  <th className="px-3.5 py-2.5">Môn & Cấp độ</th>
                  <th className="px-3 py-2.5">Phân loại</th>
                  <th className="px-3 py-2.5">Độ khó</th>
                  <th className="px-3 py-2.5">Thời lượng</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right">Giao bài</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {controller.filteredExercises.map((exercise) => {
                  const isSelected = exercise.id === controller.selectedExercise.id;
                  return (
                    <tr
                      key={exercise.id}
                      onClick={() => controller.setSelectedExerciseId(exercise.id)}
                      onDoubleClick={() => {
                        controller.setSelectedExerciseId(exercise.id);
                        setDetailModalOpen(true);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors select-none",
                        isSelected
                          ? "bg-blue-50/40 font-medium border-l-[3px] border-l-[#0F6CBD]"
                          : "hover:bg-slate-50/80 border-l-[3px] border-l-transparent"
                      )}
                    >
                      {/* Tiêu đề bài tập */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            controller.setSelectedExerciseId(exercise.id);
                            setDetailModalOpen(true);
                          }}
                          className="max-w-[320px] font-semibold text-[13px] text-slate-900 line-clamp-2 hover:text-[#0F6CBD] hover:underline text-left cursor-pointer transition-colors"
                          title="Bấm để xem danh sách câu hỏi"
                        >
                          {exercise.title}
                        </button>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {exercise.source === "teacher" ? "Giáo viên tạo" : "Hệ thống"}
                        </div>
                      </td>

                      {/* Môn & Cấp độ */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{exercise.subject}</span>
                        <span className="ml-1 text-[11px] text-slate-500">
                          • {exercise.level}
                        </span>
                      </td>

                      {/* Phân loại */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {typeLabels[exercise.type]}
                      </td>

                      {/* Độ khó */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <DifficultyBadge difficulty={exercise.difficulty} />
                      </td>

                      {/* Thời lượng */}
                      <td className="px-3 py-3 whitespace-nowrap text-slate-900">
                        <span className="font-semibold text-slate-900">{exercise.durationMinutes} phút</span>
                        <span className="mx-1 text-slate-300">•</span>
                        <span className="text-slate-500">{exercise.questionCount} câu</span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusIndicator status={exercise.status} />
                      </td>

                      {/* Nút hành động */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              <div className="p-8 text-center text-[12px] text-[#5D5F60]">
                Không tìm thấy bài tập phù hợp. Thử đổi từ khóa hoặc đặt lại bộ lọc.
              </div>
            ) : null}
          </div>
  );
}
