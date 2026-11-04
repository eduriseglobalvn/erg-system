import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import type { useCurriculumProgramQuery, useSaveCurriculumProgramMutation } from "@/features/lcms/admin-operations/api/curriculum-program-query";
import type { CurriculumRoadmapStage } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { planCurriculumSync } from "@/features/lcms/admin-operations/utils/curriculum-structure-sync";
import {
  createLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  updateLearningResourceTaxonomy,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-taxonomy-command-api";
import { createLearningResourceResource } from "@/features/lcms/admin-operations/api/learning-resource-authoring-resource-command-api";
import { cleanTaxonomyId, generateTopicCode } from "./helpers";
import type { EditableCurriculumRow } from "./types";

export type ExistingTopic = {
  id: string;
  rawId: string;
  title: string;
  lessons: Array<{ id: string; title: string }>;
};

export function useTeachingPlanSync({
  subject,
  canonicalLevelId,
  selectedStage,
  rows,
  setRows,
  existingTopics,
  saveProgramMutation,
  programQuery,
  onRefreshStructure,
  onClose,
}: {
  subject?: StudioSubject;
  canonicalLevelId: string;
  selectedStage?: CurriculumRoadmapStage;
  rows: EditableCurriculumRow[];
  setRows: Dispatch<SetStateAction<EditableCurriculumRow[]>>;
  existingTopics: ExistingTopic[];
  saveProgramMutation: ReturnType<typeof useSaveCurriculumProgramMutation>;
  programQuery: ReturnType<typeof useCurriculumProgramQuery>;
  onRefreshStructure?: () => Promise<void>;
  onClose: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("");

  async function executeSync(mode: "append" | "overwrite") {
    if (!subject?.id || !canonicalLevelId) return;

    try {
      setIsSyncing(true);
      setSyncStatusText("Đang lưu khung chương trình…");
      await saveProgramMutation.mutateAsync({
        name: `Khung chương trình ${subject.label ?? "môn học"} · ${selectedStage?.level.title ?? "Level"}`,
        status: "published",
        expectedVersion: programQuery.data?.recordVersion,
        rows: rows.map(({ isNew: _ignored, ...r }) => r),
      });
      setRows((current) => current.map((r) => ({ ...r, isNew: false })));

      const createdTopicMap = new Map<string, string>();

      if (mode === "overwrite") {
        for (let i = 0; i < existingTopics.length; i++) {
          const et = existingTopics[i];
          const cleanId = cleanTaxonomyId(et.id);
          setSyncStatusText(`Đang xóa cấu trúc cũ (${i + 1}/${existingTopics.length}): ${et.title}…`);
          try {
            await deleteLearningResourceTaxonomy("topics", cleanId);
          } catch {
            // Ignore if already deleted
          }
        }

        const uniqueTopicLabels: string[] = [];
        rows.forEach((r) => {
          const trimmed = r.topic.trim();
          if (trimmed && !uniqueTopicLabels.includes(trimmed)) {
            uniqueTopicLabels.push(trimmed);
          }
        });

        for (let i = 0; i < uniqueTopicLabels.length; i++) {
          const topicLabel = uniqueTopicLabels[i];
          setSyncStatusText(`Đang tạo chủ đề (${i + 1}/${uniqueTopicLabels.length}): ${topicLabel}…`);
          try {
            const created = await createLearningResourceTaxonomy("topics", {
              code: generateTopicCode(topicLabel),
              label: topicLabel,
              subjectId: subject.id,
              categoryId: canonicalLevelId,
              status: "active",
              sortOrder: i + 1,
              metadata: { taxonomyRole: "topic" },
            });
            if (created?.id) {
              createdTopicMap.set(topicLabel.toLowerCase(), cleanTaxonomyId(created.id));
            }
          } catch {
            // continue
          }
        }

        for (let i = 0; i < rows.length; i += 5) {
          const chunk = rows.slice(i, i + 5);
          setSyncStatusText(`Đang tạo bài học (${Math.min(i + 5, rows.length)}/${rows.length})…`);
          await Promise.all(
            chunk.map(async (row) => {
              const targetTopicId = createdTopicMap.get(row.topic.trim().toLowerCase());
              if (!targetTopicId) return;
              try {
                await createLearningResourceResource({
                  title: row.title,
                  subjectId: subject.id,
                  programSlug: subject.id,
                  categoryId: canonicalLevelId,
                  topicId: cleanTaxonomyId(targetTopicId),
                  selectedFileType: "PDF",
                  status: "published",
                  items: [{ sortOrder: row.period, unitTitle: row.title }],
                });
              } catch {
                // Ignore single creation error
              }
            }),
          );
        }
      } else {
        // Mode === "append"
        setSyncStatusText("Đang đối soát cấu trúc môn học…");
        const plan = planCurriculumSync(rows, existingTopics);

        if (!plan.topicsToCreate.length && !plan.lessonsToCreate.length) {
          toast.success("Đã lưu khung chương trình. Cấu trúc môn học đã khớp đầy đủ!");
          await programQuery.refetch();
          setIsSyncing(false);
          setSyncStatusText("");
          setTimeout(() => onClose(), 500);
          return;
        }

        for (let k = 0; k < existingTopics.length; k++) {
          const et = existingTopics[k];
          const cleanId = cleanTaxonomyId(et.id);
          createdTopicMap.set(et.title.trim().toLowerCase(), cleanId);
          try {
            await updateLearningResourceTaxonomy("topics", cleanId, { sortOrder: k + 1 });
          } catch {
            // continue
          }
        }

        for (let i = 0; i < plan.topicsToCreate.length; i++) {
          const topicLabel = plan.topicsToCreate[i];
          setSyncStatusText(`Đang tạo chủ đề (${i + 1}/${plan.topicsToCreate.length}): ${topicLabel}…`);
          try {
            const createdTopic = await createLearningResourceTaxonomy("topics", {
              code: generateTopicCode(topicLabel),
              label: topicLabel,
              subjectId: subject.id,
              categoryId: canonicalLevelId,
              status: "active",
              sortOrder: existingTopics.length + i + 1,
              metadata: { taxonomyRole: "topic" },
            });
            if (createdTopic?.id) {
              createdTopicMap.set(topicLabel.trim().toLowerCase(), cleanTaxonomyId(createdTopic.id));
            }
          } catch {
            // continue
          }
        }

        for (let j = 0; j < plan.lessonsToCreate.length; j += 5) {
          const chunk = plan.lessonsToCreate.slice(j, j + 5);
          setSyncStatusText(`Đang tạo bài học (${Math.min(j + 5, plan.lessonsToCreate.length)}/${plan.lessonsToCreate.length})…`);
          await Promise.all(
            chunk.map(async (lessonItem) => {
              const targetTopicId = createdTopicMap.get(lessonItem.topic.trim().toLowerCase());
              if (!targetTopicId) return;
              const matchingRow = rows.find(
                (r) =>
                  r.topic.trim().toLowerCase() === lessonItem.topic.trim().toLowerCase() &&
                  r.title.trim().toLowerCase() === lessonItem.title.trim().toLowerCase(),
              );
              try {
                await createLearningResourceResource({
                  title: lessonItem.title,
                  subjectId: subject.id,
                  programSlug: subject.id,
                  categoryId: canonicalLevelId,
                  topicId: cleanTaxonomyId(targetTopicId),
                  selectedFileType: "PDF",
                  status: "published",
                  items: [{ sortOrder: matchingRow?.period || 1, unitTitle: lessonItem.title }],
                });
              } catch {
                // Ignore single creation error
              }
            }),
          );
        }
      }

      setSyncStatusText("Đang cập nhật bản đồ cấu trúc môn học…");
      if (onRefreshStructure) {
        await onRefreshStructure();
      }
      await programQuery.refetch();

      toast.success(
        mode === "overwrite"
          ? "Đã làm mới cấu trúc theo khung chương trình thành công!"
          : "Đã đồng bộ thành công sang Cấu trúc môn học!",
      );
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi khi đồng bộ cấu trúc.");
    } finally {
      setIsSyncing(false);
      setSyncStatusText("");
    }
  }

  return { isSyncing, syncStatusText, executeSync };
}
