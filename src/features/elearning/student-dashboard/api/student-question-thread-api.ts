import type {
  ElearningAskTeacherAboutQuestionMutation,
  ElearningAskTeacherAboutQuestionMutationVariables,
  ElearningMyQuestionThreadsQuery,
  ElearningMyQuestionThreadsQueryVariables,
  ElearningQuestionThreadQuery,
  ElearningQuestionThreadQueryVariables,
  ElearningSendQuestionThreadMessageMutation,
  ElearningSendQuestionThreadMessageMutationVariables,
} from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import QuestionThreadDocument from "./student-question-thread.graphql?raw";

/** A list row has no messages (the server leaves them empty); the detail query and the send mutation fill them. */
export type QuestionThreadSummary = ElearningMyQuestionThreadsQuery["elearning"]["myQuestionThreads"][number];
export type QuestionThread = ElearningQuestionThreadQuery["elearning"]["questionThread"];
export type QuestionMessage = QuestionThread["messages"][number];

export const questionThreadKeys = {
  list: (accountId: string) => ["student-question-threads", accountId, "list"] as const,
  detail: (accountId: string, id: string) => ["student-question-threads", accountId, "detail", id] as const,
};

const request = { portal: "elearning" as const, query: QuestionThreadDocument };

export async function loadMyQuestionThreads(signal?: AbortSignal): Promise<QuestionThreadSummary[]> {
  const tenantId = getDefaultTenantId();
  const response = await graphQlRequest<ElearningMyQuestionThreadsQuery, ElearningMyQuestionThreadsQueryVariables & Record<string, unknown>>({
    ...request, operationName: "ElearningMyQuestionThreads", signal, tenantId, variables: { tenantId },
  });
  const valid = validateResponse(response, (v): v is ElearningMyQuestionThreadsQuery => isObject(v) && isObject(v.elearning) && Array.isArray(v.elearning.myQuestionThreads), "elearning.my-question-threads");
  return [...valid.elearning.myQuestionThreads];
}

export async function loadQuestionThread(id: string, signal?: AbortSignal): Promise<QuestionThread> {
  const tenantId = getDefaultTenantId();
  const response = await graphQlRequest<ElearningQuestionThreadQuery, ElearningQuestionThreadQueryVariables & Record<string, unknown>>({
    ...request, operationName: "ElearningQuestionThread", signal, tenantId, variables: { id, tenantId },
  });
  return validateResponse(response, (v): v is ElearningQuestionThreadQuery => isObject(v) && isObject(v.elearning) && isObject(v.elearning.questionThread), "elearning.question-thread").elearning.questionThread;
}

export async function sendQuestionThreadMessage(threadId: string, message: string): Promise<QuestionThread> {
  const tenantId = getDefaultTenantId();
  const response = await graphQlRequest<ElearningSendQuestionThreadMessageMutation, ElearningSendQuestionThreadMessageMutationVariables & Record<string, unknown>>({
    ...request, operationName: "ElearningSendQuestionThreadMessage", tenantId, variables: { input: { tenantId, threadId, message } },
  });
  return validateResponse(response, (v): v is ElearningSendQuestionThreadMessageMutation => isObject(v) && isObject(v.sendQuestionThreadMessage), "elearning.question-thread-send").sendQuestionThreadMessage;
}

/** Opens a new thread for question `questionIndex` (1-based) of an assignment; `idempotencyKey` makes a double submit harmless. */
export async function askTeacherAboutQuestion(assignmentId: string, questionIndex: number, message: string): Promise<QuestionThread> {
  const tenantId = getDefaultTenantId();
  const response = await graphQlRequest<ElearningAskTeacherAboutQuestionMutation, ElearningAskTeacherAboutQuestionMutationVariables & Record<string, unknown>>({
    ...request, operationName: "ElearningAskTeacherAboutQuestion", tenantId,
    variables: { input: { tenantId, idempotencyKey: crypto.randomUUID(), assignmentId, questionIndex, message } },
  });
  return validateResponse(response, (v): v is ElearningAskTeacherAboutQuestionMutation => isObject(v) && isObject(v.askTeacherAboutQuestion), "elearning.question-thread-ask").askTeacherAboutQuestion;
}
