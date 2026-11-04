import Add from "@mui/icons-material/Add";
import AutoStories from "@mui/icons-material/AutoStories";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { cn } from "@/lib/utils";

export function SubjectRail({
  subjects,
  selectedSubjectId,
  query,
  onSelectSubject,
  onBackToSubjects,
  onCreateSubject,
}: {
  subjects: StudioSubject[];
  selectedSubjectId?: string;
  query: string;
  onSelectSubject: (id: string) => void;
  onBackToSubjects: () => void;
  onCreateSubject?: () => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleSubjects = normalizedQuery
    ? subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery))
    : subjects;

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#D9E2EF] bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#D9E2EF] px-3">
        <span className="text-[12px] font-bold uppercase tracking-wide text-[#52606D]">Môn học</span>
        <div className="flex items-center gap-1">
          {onCreateSubject ? (
            <Tooltip title="Tạo môn học mới">
              <IconButton size="small" color="primary" onClick={onCreateSubject} sx={{ p: 0.5 }}>
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : null}
          <Button size="small" variant="text" onClick={onBackToSubjects} sx={{ minWidth: 0, px: 0.75, fontSize: 12 }}>
            Quản lý
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
        {visibleSubjects.map((subject) => {
          const selected = subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              type="button"
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75B6F2]",
                selected ? "border-[#B8D6FA] bg-[#EAF4FF]" : "border-transparent hover:bg-[#F4F7FA]",
              )}
              onClick={() => onSelectSubject(subject.id)}
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", selected ? "bg-white text-[#0F6CBD]" : "bg-[#F1F4F7] text-[#52606D]") }>
                <AutoStories className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-[#172033]">{subject.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#637381]">{subject.groupCount} level · {subject.lessonCount} bài học</span>
              </span>
            </button>
          );
        })}
        {!visibleSubjects.length ? <p className="px-3 py-6 text-center text-xs text-[#637381]">Không tìm thấy môn học.</p> : null}
      </div>
      {onCreateSubject ? (
        <div className="border-t border-[#D9E2EF] p-2">
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<Add fontSize="small" />}
            onClick={onCreateSubject}
            sx={{
              textTransform: "none",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 1.5,
              borderColor: "#CBD5E1",
              color: "#0F6CBD",
              "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F0F7FF" },
            }}
          >
            Thêm môn học
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
