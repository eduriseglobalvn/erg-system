import { canonicalWorkspaceForPath } from "@/platform/workspaces/workspace-route";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { mapWorkspace, type QuestionBankWorkspaceDTO } from "@/features/question-bank/api/question-bank-mappers";
import type {
  QuestionBankQuestion,
  QuestionBankSubject,
  QuizBankItem,
  QuizBankKind,
} from "@/features/question-bank/types/question-bank-types";
import { apiRequest } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import { isObject, validateResponse } from "@/lib/validate-response";

// A teacher session only holds the lms portal: pinning these calls to lcms made the client refuse them before sending (BUG-A-048).
const bankPortal = () => (typeof window !== "undefined" && canonicalWorkspaceForPath(window.location.pathname) === "TEACHER" ? "lms" : "lcms");

export type QuestionBankWorkspaceInput = {
  tenantId?: string;
  search?: string;
  subjectId?: string;
  levelId?: string;
  topicId?: string;
  status?: string;
  quizKind?: string;
  includeQuestions?: boolean;
  page?: number;
  size?: number;
};

type QuestionBankWorkspaceResponse = {
  lcms: {
    questionBankWorkspace: QuestionBankWorkspaceDTO;
  };
};

export type QuestionBankApiData = {
  questions: QuestionBankQuestion[];
  questionPage: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  quizzes: QuizBankItem[];
  subjects: QuestionBankSubject[];
};

const QuestionBankWorkspaceDocument = `
query QuestionBankWorkspace($input: QuestionBankWorkspaceInput) {
  lcms {
    questionBankWorkspace(input: $input) {
      tenantId
      questions {
        items {
          id
          scopeType
          scopeId
          scopeLabel
          subjectId
          subjectLabel
          levelId
          levelLabel
          topicId
          categoryLabel
          gradeLabel
          title
          objective
          type
          difficulty
          status
          tags
          choices {
            id
            label
            correct
          }
          answer
          masteryRate
          usageCount
          schoolsUsing
          lastUsedAt
          recommendedCluster
          rationale
          runtimeQuestion
          fromQuizEditor
          sourceQuizId
          sourceSlideId
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      subjects {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
      }
      levels {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
      }
      topics {
        id
        label
        subjectId
        levelId
        description
        scopeLabel
        categoryIds
        questionCount
      }
      quizzes {
        id
        title
        status
        kind
        subjectId
        levelId
        categoryId
        questionIds
        questionCount
        durationLabel
        scopeLabel
        sourceMode
        ownerLabel
        updatedAt
      }
    }
  }
}
`;

export async function loadQuestionBankData(
  tenantId: string = getDefaultTenantId(),
  filters: Omit<QuestionBankWorkspaceInput, "tenantId"> = {},
  signal?: AbortSignal,
): Promise<QuestionBankApiData> {
  if (import.meta.env.DEV && runtimeFixturesEnabled()) return (await import("@/test/fixtures/mock-question-bank")).mockQuestionBankData();
  const raw = await loadQuestionBankWorkspace(
    { ...filters, tenantId, page: filters.page ?? 0, size: filters.size ?? 50 },
    signal,
  );
  return mapWorkspace(raw);
}

export type QuizBankMetaInput = { quizId: string; title?: string; kind?: QuizBankKind };
export type QuizBankMetaResult = { quizId: string; title: string; kind: QuizBankKind; updatedAt?: string | null };

/** Renames a quiz or changes its kind (the list reads these from the quiz, not from its draft). */
export async function updateQuizBankMeta({ quizId, ...body }: QuizBankMetaInput): Promise<QuizBankMetaResult> {
  return apiRequest<QuizBankMetaResult>(API_ENDPOINTS.lcms.quiz(quizId), {
    body: JSON.stringify(body),
    method: "PATCH",
    portal: bankPortal(),
  });
}

async function loadQuestionBankWorkspace(input: QuestionBankWorkspaceInput, signal?: AbortSignal): Promise<QuestionBankWorkspaceDTO> {
  return requestQuestionBankWorkspacePage(normalizeQuestionBankInput(input), signal);
}

async function requestQuestionBankWorkspacePage(input: QuestionBankWorkspaceInput, signal?: AbortSignal) {
  const response = await graphQlRequest<QuestionBankWorkspaceResponse, { input: QuestionBankWorkspaceInput }>({
    operationName: "QuestionBankWorkspace",
    portal: bankPortal(),
    query: QuestionBankWorkspaceDocument,
    signal,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: {
      input,
    },
  });

  return validateResponse(
    response,
    isQuestionBankWorkspaceResponse,
    "lcms.question-bank-workspace",
  ).lcms.questionBankWorkspace;
}

function isQuestionBankWorkspaceResponse(value: unknown): value is QuestionBankWorkspaceResponse {
  if (!isObject(value) || !isObject(value.lcms) || !isObject(value.lcms.questionBankWorkspace)) return false;
  const workspace = value.lcms.questionBankWorkspace;
  return Array.isArray(workspace.subjects) && Array.isArray(workspace.levels) &&
    Array.isArray(workspace.topics) && Array.isArray(workspace.quizzes) &&
    (workspace.questions === null || workspace.questions === undefined ||
      (isObject(workspace.questions) && Array.isArray(workspace.questions.items)));
}

function normalizeQuestionBankInput(input: QuestionBankWorkspaceInput): QuestionBankWorkspaceInput {
  return {
    ...input,
    ...(input.includeQuestions === undefined ? {} : { includeQuestions: input.includeQuestions }),
    page: Math.max(0, input.page ?? 0),
    quizKind: input.quizKind?.trim() || undefined,
    search: input.search?.trim() || undefined,
    size: Math.min(Math.max(input.size ?? 50, 1), 50),
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
}

export function emptyQuestionBankData(): QuestionBankApiData {
  return {
    questions: [],
    questionPage: { page: 0, size: 0, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    quizzes: [],
    subjects: [],
  };
}
