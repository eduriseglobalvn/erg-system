import type {
  TeachingCalendarCancelScheduleBatchV2MutationVariables,
  TeachingCalendarPeriodTemplatesQuery,
  TeachingCalendarPublishScheduleBatchV2Mutation,
  TeachingCalendarPublishScheduleBatchV2MutationVariables,
  TeachingCalendarCancelScheduleBatchV2Mutation,
  TeachingCalendarRenameScheduleBatchMutation,
  TeachingCalendarRenameScheduleBatchMutationVariables,
  TeachingCalendarSaveScheduleDraftMutation,
  TeachingCalendarSaveScheduleDraftMutationVariables,
  TeachingCalendarScheduleDraftQuery,
  TeachingCalendarScheduleDraftQueryVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import scheduleDocument from "./teaching-calendar-schedule.graphql?raw";

export type TeachingScheduleDraftResult = TeachingCalendarSaveScheduleDraftMutation["saveTeachingScheduleDraft"];
export type TeachingScheduleDraftInput = TeachingCalendarSaveScheduleDraftMutationVariables["input"];
export type TeachingScheduleBatchState = TeachingCalendarPublishScheduleBatchV2Mutation["publishTeachingScheduleBatch"];
export type TeachingPeriodTemplate = TeachingCalendarPeriodTemplatesQuery["lcms"]["teachingPeriodTemplates"][number];

export async function loadTeachingPeriodTemplates(signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarPeriodTemplatesQuery, Record<string, never>>(scheduleDocument, { operationName: "TeachingCalendarPeriodTemplates", signal });
  return data.lcms.teachingPeriodTemplates;
}

export async function loadTeachingScheduleDraft(batchId: string, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarScheduleDraftQuery, TeachingCalendarScheduleDraftQueryVariables & Record<string, unknown>>(scheduleDocument, { operationName: "TeachingCalendarScheduleDraft", signal, variables: { batchId } });
  return data.lcms.teachingScheduleDraft;
}

export async function saveTeachingScheduleDraft(input: TeachingScheduleDraftInput, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarSaveScheduleDraftMutation, TeachingCalendarSaveScheduleDraftMutationVariables & Record<string, unknown>>(scheduleDocument, { operationName: "TeachingCalendarSaveScheduleDraft", signal, variables: { input } });
  return data.saveTeachingScheduleDraft;
}

export async function publishTeachingScheduleBatchV2(batchId: string, expectedVersion: number) {
  const data = await requestTeachingCalendar<TeachingCalendarPublishScheduleBatchV2Mutation, TeachingCalendarPublishScheduleBatchV2MutationVariables & Record<string, unknown>>(scheduleDocument, { operationName: "TeachingCalendarPublishScheduleBatchV2", variables: { batchId, expectedVersion } });
  return data.publishTeachingScheduleBatch;
}

export async function cancelTeachingScheduleBatchV2(batchId: string, expectedVersion: number) {
  const data = await requestTeachingCalendar<TeachingCalendarCancelScheduleBatchV2Mutation, TeachingCalendarCancelScheduleBatchV2MutationVariables & Record<string, unknown>>(scheduleDocument, { operationName: "TeachingCalendarCancelScheduleBatchV2", variables: { batchId, expectedVersion } });
  return data.cancelTeachingScheduleBatch;
}

export async function renameTeachingScheduleBatch(batchId: string, label: string, expectedVersion: number) {
  const data = await requestTeachingCalendar<TeachingCalendarRenameScheduleBatchMutation, TeachingCalendarRenameScheduleBatchMutationVariables & Record<string, unknown>>(scheduleDocument, { operationName: "TeachingCalendarRenameScheduleBatch", variables: { batchId, expectedVersion, label } });
  return data.renameTeachingScheduleBatch;
}
