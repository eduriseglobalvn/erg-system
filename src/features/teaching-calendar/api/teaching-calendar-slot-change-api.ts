import type {
  TeachingCalendarEditScheduleSlotMutation,
  TeachingCalendarEditScheduleSlotMutationVariables,
  TeachingCalendarSwapScheduleTeacherMutation,
  TeachingCalendarSwapScheduleTeacherMutationVariables,
} from "@/lib/api/generated/graphql";

import { requestTeachingCalendar } from "./teaching-calendar-document";
import slotChangeDocument from "./teaching-calendar-slot-change.graphql?raw";

export type EditSlotInput = TeachingCalendarEditScheduleSlotMutationVariables["input"];
export type SwapTeacherInput = TeachingCalendarSwapScheduleTeacherMutationVariables["input"];
export type SlotChangeResult = TeachingCalendarEditScheduleSlotMutation["editTeachingScheduleSlot"];

/** `dryRun: true` ghi gi cung khong: tra so tiet bi anh huong va xung dot de xem truoc. */
export async function editTeachingScheduleSlot(input: EditSlotInput, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarEditScheduleSlotMutation, TeachingCalendarEditScheduleSlotMutationVariables & Record<string, unknown>>(
    slotChangeDocument, { operationName: "TeachingCalendarEditScheduleSlot", signal, variables: { input } });
  return data.editTeachingScheduleSlot;
}

export async function swapTeachingScheduleTeacher(input: SwapTeacherInput, signal?: AbortSignal) {
  const data = await requestTeachingCalendar<TeachingCalendarSwapScheduleTeacherMutation, TeachingCalendarSwapScheduleTeacherMutationVariables & Record<string, unknown>>(
    slotChangeDocument, { operationName: "TeachingCalendarSwapScheduleTeacher", signal, variables: { input } });
  return data.swapTeachingScheduleTeacher;
}
