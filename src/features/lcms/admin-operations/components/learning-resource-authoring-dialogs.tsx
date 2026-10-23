import type { Dispatch, SetStateAction } from "react";

import type {
  CurriculumTaxonomyImpact,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { createLearningResourceResource } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { TaxonomyCreateDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-create-dialog";
import {
  LocalContentEditDialog,
  TaxonomyDeleteDialog,
  TaxonomyEditDialog,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import { nodeIdForCreated } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import type {
  LocalContentEditTarget,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyDeleteTarget,
  TaxonomyDialogState,
  TaxonomyEditTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

type Props = {
  dialogState: TaxonomyDialogState;
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  quizBankItems: QuizBankItem[];
  editTarget: TaxonomyEditTarget | null;
  deleteTarget: TaxonomyDeleteTarget | null;
  deleteImpactEstimate: CurriculumTaxonomyImpact | null;
  editingLocalContent: LocalContentEditTarget;
  refreshData: (options?: { force?: boolean }) => Promise<LearningResourceTaxonomyResponse>;
  setDialogState: Dispatch<SetStateAction<TaxonomyDialogState>>;
  setEditTarget: Dispatch<SetStateAction<TaxonomyEditTarget | null>>;
  setDeleteTarget: Dispatch<SetStateAction<TaxonomyDeleteTarget | null>>;
  setEditingLocalContent: Dispatch<SetStateAction<LocalContentEditTarget>>;
  setLocalContentItems: Dispatch<SetStateAction<LocalContentItem[]>>;
  setSelectedSubjectId: Dispatch<SetStateAction<string>>;
  setSelectedNodeId: Dispatch<SetStateAction<string>>;
  updateLocalContentItem: (itemId: string, patch: Partial<LocalContentItem>) => void;
};

export function LearningResourceAuthoringDialogs({
  dialogState,
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  quizBankItems,
  editTarget,
  deleteTarget,
  deleteImpactEstimate,
  editingLocalContent,
  refreshData,
  setDialogState,
  setEditTarget,
  setDeleteTarget,
  setEditingLocalContent,
  setLocalContentItems,
  setSelectedSubjectId,
  setSelectedNodeId,
  updateLocalContentItem,
}: Props) {
  return (
    <>
      <TaxonomyCreateDialog
        key={dialogState ? `open-${dialogState.mode}-${dialogState.initialOption ?? ""}` : "closed"}
        state={dialogState}
        subjects={subjects}
        selectedSubject={selectedSubject}
        selectedNode={selectedNode}
        selectedPath={selectedPath}
        quizBankItems={quizBankItems}
        onClose={() => setDialogState(null)}
        onCreateLocalContent={async (items) => {
          setLocalContentItems((current) => [...items, ...current]);
          setDialogState(null);
        }}
        onCreateLecture={async (payload) => {
          await createLearningResourceResource(payload);
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onUploadResource={async () => {
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onCreated={async ({ mode, kind, id, subjectId }) => {
          const nextModel = await refreshData({ force: true });
          if (mode === "subject") {
            setSelectedSubjectId(id);
            setSelectedNodeId("");
            return;
          }
          const nextSubjectId = subjectId || selectedSubject?.id;
          const subjectStillExists = nextModel.subjects.some((subject) => subject.id === nextSubjectId);
          if (nextSubjectId && subjectStillExists) setSelectedSubjectId(nextSubjectId);
          setSelectedNodeId(nodeIdForCreated(kind, id));
        }}
      />
      <TaxonomyEditDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          await refreshData({ force: true });
          setEditTarget(null);
        }}
      />
      <TaxonomyDeleteDialog
        estimatedImpact={deleteImpactEstimate}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => {
          await refreshData({ force: true });
          setDeleteTarget(null);
          if (deleteTarget?.kind === "subject") {
            setSelectedSubjectId("");
            setSelectedNodeId("");
          } else if (deleteTarget?.id === selectedNode?.optionId) {
            setSelectedNodeId("");
          }
        }}
      />
      <LocalContentEditDialog
        target={editingLocalContent}
        onClose={() => setEditingLocalContent(null)}
        onSaved={(patch) => {
          if (!editingLocalContent) return;
          updateLocalContentItem(editingLocalContent.id, patch);
          setEditingLocalContent(null);
        }}
      />
    </>
  );
}
