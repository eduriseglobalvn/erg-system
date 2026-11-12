import type {
  ElearningDeleteStudentDiscussionItemMutation,
  ElearningDeleteStudentDiscussionItemMutationVariables,
  ElearningDiscussionModerationClassesQuery,
  ElearningDiscussionModerationFeedQuery,
  ElearningDiscussionModerationFeedQueryVariables,
  ElearningSetStudentDiscussionHiddenMutation,
  ElearningSetStudentDiscussionHiddenMutationVariables,
} from "@/lib/api/generated/graphql";
import { graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import DiscussionModerationDocument from "./discussion-moderation.graphql?raw";

export type ModerationTargetType = "POST" | "COMMENT";
export type ModerationFeed = ElearningDiscussionModerationFeedQuery["elearning"]["discussionModerationFeed"];
export type ModerationPost = ModerationFeed["items"][number];
export type ModerationComment = ModerationPost["comments"][number];
export type ModerationReply = ModerationComment["replies"][number];

/** Teacher pages talk to the backend as "lms", Admin pages as "lcms"; the backend scopes classes by role. */
export const discussionModerationKeys = {
  classes: (portal: GraphQlPortal) => ["discussion-moderation", portal, "classes"] as const,
  feed: (portal: GraphQlPortal, classId: string) => ["discussion-moderation", portal, "feed", classId] as const,
};

export async function loadModerationClasses(portal: GraphQlPortal, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningDiscussionModerationClassesQuery>({
    operationName: "ElearningDiscussionModerationClasses",
    portal,
    query: DiscussionModerationDocument,
    signal,
  });
  return validateResponse(response, (value): value is ElearningDiscussionModerationClassesQuery =>
    isObject(value) && isObject(value.elearning) && Array.isArray(value.elearning.discussionModerationClasses),
  "elearning.discussion-moderation-classes").elearning.discussionModerationClasses;
}

export async function loadModerationFeed(portal: GraphQlPortal, classId: string, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningDiscussionModerationFeedQuery, ElearningDiscussionModerationFeedQueryVariables & Record<string, unknown>>({
    operationName: "ElearningDiscussionModerationFeed",
    portal,
    query: DiscussionModerationDocument,
    signal,
    variables: { input: { classId, page: 0, size: 50 } },
  });
  return validateResponse(response, (value): value is ElearningDiscussionModerationFeedQuery =>
    isObject(value) && isObject(value.elearning) && isObject(value.elearning.discussionModerationFeed)
      && Array.isArray(value.elearning.discussionModerationFeed.items),
  "elearning.discussion-moderation-feed").elearning.discussionModerationFeed;
}

export async function setDiscussionItemHidden(portal: GraphQlPortal, targetType: ModerationTargetType, targetId: string, hidden: boolean) {
  return graphQlRequest<ElearningSetStudentDiscussionHiddenMutation, ElearningSetStudentDiscussionHiddenMutationVariables & Record<string, unknown>>({
    operationName: "ElearningSetStudentDiscussionHidden",
    portal,
    query: DiscussionModerationDocument,
    variables: { input: { hidden, targetId, targetType } },
  });
}

export async function deleteDiscussionItem(portal: GraphQlPortal, targetType: ModerationTargetType, targetId: string) {
  return graphQlRequest<ElearningDeleteStudentDiscussionItemMutation, ElearningDeleteStudentDiscussionItemMutationVariables & Record<string, unknown>>({
    operationName: "ElearningDeleteStudentDiscussionItem",
    portal,
    query: DiscussionModerationDocument,
    variables: { input: { targetId, targetType } },
  });
}
