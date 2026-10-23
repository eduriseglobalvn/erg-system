import { slugify } from "@/features/lms/learning-resources/api/learning-resource-normalizers";
import type {
  CopyLearningResourceExplorerItemOperation,
  CreateLearningResourceExerciseOperation,
  CreateLearningResourceFolderOperation,
  CreateLearningResourceLectureOperation,
  DeleteLearningResourceExplorerItemOperation,
  LearningResourceExplorerOperation,
  LearningResourceExplorerOperationItem,
  LearningResourceExplorerOperationResult,
  MoveLearningResourceExplorerItemOperation,
  RenameLearningResourceExplorerItemOperation,
} from "@/features/lms/learning-resources/api/learning-resource-types";

export async function saveExplorerOperation(operation: LearningResourceExplorerOperation): Promise<LearningResourceExplorerOperationResult> {
  return mockSaveExplorerOperation(operation);
}

export function saveCreateFolderOperation(input: Omit<CreateLearningResourceFolderOperation, "type">) {
  return saveExplorerOperation({ type: "create_folder", ...input });
}

export function saveCreateLectureOperation(input: Omit<CreateLearningResourceLectureOperation, "type">) {
  return saveExplorerOperation({ type: "create_lecture", ...input });
}

export function saveCreateExerciseOperation(input: Omit<CreateLearningResourceExerciseOperation, "type">) {
  return saveExplorerOperation({ type: "create_exercise", ...input });
}

export function saveMoveExplorerItemOperation(input: Omit<MoveLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "move", ...input });
}

export function saveCopyExplorerItemOperation(input: Omit<CopyLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "copy", ...input });
}

export function saveRenameExplorerItemOperation(input: Omit<RenameLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "rename", ...input });
}

export function saveDeleteExplorerItemOperation(input: Omit<DeleteLearningResourceExplorerItemOperation, "type">) {
  return saveExplorerOperation({ type: "delete", ...input });
}

async function mockSaveExplorerOperation(operation: LearningResourceExplorerOperation): Promise<LearningResourceExplorerOperationResult> {
  await Promise.resolve();

  return {
    operationId: `mock-explorer-op-${operation.type}-${mockOperationSuffix(operation)}`,
    status: "mock_saved",
    operation,
    item: mockOperationItem(operation),
    affectedIds: "targetId" in operation ? [operation.targetId] : undefined,
    savedAt: new Date(0).toISOString(),
  };
}

function mockOperationItem(operation: LearningResourceExplorerOperation): LearningResourceExplorerOperationItem | undefined {
  if (operation.type === "create_folder") {
    return {
      id: `folder-${slugify(operation.name)}`,
      type: "folder",
      name: operation.name,
      parentId: operation.parentId,
    };
  }

  if (operation.type === "create_lecture" || operation.type === "create_exercise") {
    return {
      id: `${operation.type === "create_lecture" ? "lecture" : "exercise"}-${slugify(operation.title)}`,
      type: operation.type === "create_lecture" ? "lecture" : "exercise",
      name: operation.title,
      parentId: operation.parentId,
    };
  }

  if (operation.type === "rename") {
    return {
      id: operation.targetId,
      type: "resource",
      name: operation.name,
    };
  }

  return undefined;
}

function mockOperationSuffix(operation: LearningResourceExplorerOperation) {
  if ("clientRequestId" in operation && operation.clientRequestId) return slugify(operation.clientRequestId);
  if ("name" in operation) return slugify(operation.name);
  if ("title" in operation) return slugify(operation.title);
  if ("targetId" in operation) return slugify(operation.targetId);
  return "operation";
}
