import { useState } from "react";
import QuizIcon from "@mui/icons-material/Quiz";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField, ErgTextField } from "@/components/erg-mui/erg-form";
import { MobileAssignmentResourceList } from "@/features/lms/components/assign-homework-parts";
import { MobileFormSection, MobileRowText, mobileCardSx } from "@/features/lms/components/assign-homework-mobile/mobile-form-section";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** N8 section 1: the chosen exercise (with "Đổi") and the assignment title the API requires. */
export function ResourceSection({ model }: { model: AssignHomeworkController }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const resources = model.selectedLevel?.topics.flatMap((topic) => topic.items) ?? [];
  const selected = resources.filter((resource) => model.selectedResourceIds.has(resource.id));
  const single = selected.length === 1 ? selected[0] : undefined;

  return (
    <MobileFormSection number={1} title="Nội dung">
      <Box sx={{ ...mobileCardSx, alignItems: "center", display: "flex", gap: 1.5, px: 1.75, py: 1.5 }}>
        <Box aria-hidden sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: "primary.main", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}>
          <QuizIcon />
        </Box>
        <MobileRowText
          meta={single ? `${single.activityLabel} · ${single.questionCount} câu · ${single.durationLabel}` : selected.length === 0 ? "Chọn một bài trong kho luyện tập" : undefined}
          title={single?.title ?? (selected.length > 1 ? model.selectedResourceLabel : "Chưa chọn bài")}
        />
        <ErgButton onClick={() => setPickerOpen(true)} size="small" variant="text">Đổi</ErgButton>
      </Box>
      <ErgTextField
        label="Tên bài tập"
        onChange={(event) => model.setTitle(event.target.value)}
        placeholder="Nhập tên bài tập"
        required
        size="small"
        value={model.title}
      />

      <MobileBottomSheet description={model.selectedResourceLabel} onOpenChange={setPickerOpen} open={pickerOpen} title="Chọn bài">
        <ErgSearchField
          onChange={(event) => model.setResourceSearch(event.target.value)}
          placeholder="Tìm bài tập"
          value={model.resourceSearch}
        />
        <MobileAssignmentResourceList
          onToggleResource={model.toggleResourceSelection}
          resources={model.filteredResourceTopics.flatMap((topic) => topic.items)}
          selectedResourceIds={model.selectedResourceIds}
        />
        {resources.length === 0 ? <Typography color="text.secondary" variant="body2">Kho luyện tập chưa có bài.</Typography> : null}
      </MobileBottomSheet>
    </MobileFormSection>
  );
}
