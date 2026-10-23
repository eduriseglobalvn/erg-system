import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { mapCurriculumTaxonomyNode, toCurriculumTaxonomyRequest } from "@/features/lcms/admin-operations/api/learning-resource-authoring-content-mapper";
import { curriculumTaxonomyPath } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type { CreateTaxonomyPayload, CurriculumTaxonomyImpact, LearningResourceTaxonomyOption } from "@/features/lcms/admin-operations/api/learning-resource-authoring-domain-types";
import type { CurriculumTreeNodeResponse } from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

export async function createLearningResourceTaxonomy(kind: string, payload: CreateTaxonomyPayload) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  const createPath = curriculumPath === "levels" && payload.subjectId
    ? API_ENDPOINTS.curriculum.subjectLevels(payload.subjectId)
    : curriculumPath === "topics" && (payload.categoryId || payload.parentId)
      ? API_ENDPOINTS.curriculum.levelTopics(payload.categoryId || payload.parentId || "")
      : API_ENDPOINTS.curriculum.collection(curriculumPath);
  const node = await apiRequest<CurriculumTreeNodeResponse>(createPath, {
    method: "POST",
    body: JSON.stringify(toCurriculumTaxonomyRequest(payload)),
  });
  return mapCurriculumTaxonomyNode(node, payload);
}

export async function updateLearningResourceTaxonomy(kind: string, id: string, payload: Partial<CreateTaxonomyPayload>) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  const node = await apiRequest<CurriculumTreeNodeResponse>(API_ENDPOINTS.curriculum.entity(curriculumPath, id), {
    method: "PATCH",
    body: JSON.stringify(toCurriculumTaxonomyRequest(payload)),
  });
  return mapCurriculumTaxonomyNode(node, { id, ...payload });
}

export function deleteLearningResourceTaxonomy(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  return apiRequest<{ deleted: boolean }>(API_ENDPOINTS.curriculum.entity(curriculumPath, id), {
    method: "DELETE",
  });
}

export function loadLearningResourceTaxonomyImpact(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Curriculum impact is only available for subject, level, and topic taxonomy kinds. Received "${kind}".`);
  }
  return apiRequest<CurriculumTaxonomyImpact>(API_ENDPOINTS.curriculum.impact(curriculumPath, id));
}

export function archiveLearningResourceTaxonomy(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Curriculum archive is only available for subject, level, and topic taxonomy kinds. Received "${kind}".`);
  }
  return apiRequest<LearningResourceTaxonomyOption>(API_ENDPOINTS.curriculum.archive(curriculumPath, id), {
    method: "POST",
  });
}
