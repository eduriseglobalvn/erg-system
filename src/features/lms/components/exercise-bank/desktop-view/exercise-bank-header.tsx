import Button from "@mui/material/Button";
import { ArrowLeft, Copy, FolderDown, Plus } from "lucide-react";
import type { ExerciseBankController } from "../use-exercise-bank-controller";

export function ExerciseBankHeader({
  controller,
  onBack,
  onOpenPortable,
}: {
  controller: ExerciseBankController;
  onBack: () => void;
  onOpenPortable?: () => void;
}) {
  return (
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[#CDCFD1] bg-white text-[#131416] hover:bg-[#F4F6F8] transition-colors"
            title="Quay lại danh sách bài tập"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold tracking-tight text-[#131416]">
                Kho bài tập
              </h1>
              <span className="inline-flex items-center rounded bg-[#EBEDEE] px-2 py-0.5 text-[11px] font-semibold text-[#353736]">
                {controller.filteredExercises.length} bài
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPortable ? (
            <Button
              variant="outlined"
              onClick={onOpenPortable}
              startIcon={<FolderDown className="h-3.5 w-3.5" />}
              sx={{
                height: 34,
                borderRadius: "6px",
                px: 2,
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "none",
                borderColor: "#CDCFD1",
                color: "#131416",
                bgcolor: "#FFFFFF",
                boxShadow: "none",
                "&:hover": { borderColor: "#5D5F60", bgcolor: "#F4F6F8" },
              }}
            >
              Gói offline
            </Button>
          ) : null}
          <Button
            variant="outlined"
            onClick={() => controller.duplicateExercise()}
            startIcon={<Copy className="h-3.5 w-3.5" />}
            sx={{
              height: 34,
              borderRadius: "6px",
              px: 2,
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "none",
              borderColor: "#CDCFD1",
              color: "#131416",
              bgcolor: "#FFFFFF",
              boxShadow: "none",
              "&:hover": { borderColor: "#5D5F60", bgcolor: "#F4F6F8" },
            }}
          >
            Nhân bản
          </Button>
          <Button
            variant="contained"
            onClick={() => controller.openCreateDialog()}
            startIcon={<Plus className="h-4 w-4" />}
            sx={{
              height: 34,
              borderRadius: "6px",
              px: 2.5,
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "none",
              bgcolor: "#0F6CBD",
              boxShadow: "0 1px 3px rgba(15, 108, 189, 0.25)",
              "&:hover": { bgcolor: "#0B5CAB" },
            }}
          >
            Tạo bài mới
          </Button>
        </div>
      </header>
  );
}
