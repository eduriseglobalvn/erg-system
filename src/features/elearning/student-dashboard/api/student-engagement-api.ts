import type {
  CreateStudentDiscussionInput,
  ElearningCreateStudentDiscussionMutation,
  ElearningCreateStudentDiscussionMutationVariables,
  ElearningMarkStudentAnnouncementReadMutation,
  ElearningMarkStudentAnnouncementReadMutationVariables,
  ElearningReplyStudentDiscussionMutation,
  ElearningReplyStudentDiscussionMutationVariables,
  ElearningSetStudentDiscussionReactionMutation,
  ElearningSetStudentDiscussionReactionMutationVariables,
  ElearningStudentDiscussionFeedQuery,
  ElearningStudentDiscussionFeedQueryVariables,
  MarkStudentAnnouncementReadInput,
  ReplyStudentDiscussionInput,
  SetStudentDiscussionReactionInput,
} from "@/lib/api/generated/graphql";
import type {
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
  StudentDiscussionReactionSummary,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { createReactionSummary, discussionReactionKeys } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import StudentEngagementDocument from "./student-engagement.graphql?raw";

export type StudentDiscussionFeedPage = {
  items: StudentDiscussionFeedPost[];
  page: number;
  size: number;
  totalItems: number;
  hasNext: boolean;
};

export async function loadStudentDiscussionFeed({
  tenantId = getDefaultTenantId(),
  accountId: _accountId,
  page = 0,
  size = 20,
  signal,
}: {
  tenantId?: string;
  accountId?: string | null;
  page?: number;
  size?: number;
  signal?: AbortSignal;
} = {}): Promise<StudentDiscussionFeedPage> {
  const response = await graphQlRequest<ElearningStudentDiscussionFeedQuery, ElearningStudentDiscussionFeedQueryVariables & Record<string, unknown>>({
    operationName: "ElearningStudentDiscussionFeed",
    portal: "elearning",
    query: StudentEngagementDocument,
    signal,
    tenantId,
    variables: { input: { page, size, tenantId } },
  });
  const valid = validateResponse(response, isDiscussionFeedResponse, "elearning.discussion-feed");
  const feed = valid.elearning.discussionFeed;
  return {
    hasNext: feed.hasNext,
    items: feed.items.map(mapPost),
    page: feed.page,
    size: feed.size,
    totalItems: feed.totalItems,
  };
}

export async function createStudentDiscussion(input: CreateStudentDiscussionInput, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningCreateStudentDiscussionMutation, ElearningCreateStudentDiscussionMutationVariables & Record<string, unknown>>({
    operationName: "ElearningCreateStudentDiscussion",
    portal: "elearning",
    query: StudentEngagementDocument,
    signal,
    tenantId: input.tenantId ?? undefined,
    variables: { input },
  });
  return validateResponse(response, hasObjectField("createStudentDiscussion", "id"), "elearning.discussion-create").createStudentDiscussion;
}

export async function replyStudentDiscussion(input: ReplyStudentDiscussionInput, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningReplyStudentDiscussionMutation, ElearningReplyStudentDiscussionMutationVariables & Record<string, unknown>>({
    operationName: "ElearningReplyStudentDiscussion",
    portal: "elearning",
    query: StudentEngagementDocument,
    signal,
    tenantId: input.tenantId ?? undefined,
    variables: { input },
  });
  return validateResponse(response, hasObjectField("replyStudentDiscussion", "id"), "elearning.discussion-reply").replyStudentDiscussion;
}

export async function setStudentDiscussionReaction(input: SetStudentDiscussionReactionInput, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningSetStudentDiscussionReactionMutation, ElearningSetStudentDiscussionReactionMutationVariables & Record<string, unknown>>({
    operationName: "ElearningSetStudentDiscussionReaction",
    portal: "elearning",
    query: StudentEngagementDocument,
    signal,
    tenantId: input.tenantId ?? undefined,
    variables: { input },
  });
  return validateResponse(response, hasObjectField("setStudentDiscussionReaction", "targetId"), "elearning.discussion-reaction").setStudentDiscussionReaction;
}

export async function markStudentAnnouncementRead(input: MarkStudentAnnouncementReadInput, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningMarkStudentAnnouncementReadMutation, ElearningMarkStudentAnnouncementReadMutationVariables & Record<string, unknown>>({
    operationName: "ElearningMarkStudentAnnouncementRead",
    portal: "elearning",
    query: StudentEngagementDocument,
    signal,
    tenantId: input.tenantId ?? undefined,
    variables: { input },
  });
  return validateResponse(response, hasObjectField("markStudentAnnouncementRead", "announcementId"), "elearning.announcement-read").markStudentAnnouncementRead;
}

function isDiscussionFeedResponse(value: unknown): value is ElearningStudentDiscussionFeedQuery {
  if (!isObject(value) || !isObject(value.elearning) || !isObject(value.elearning.discussionFeed)) return false;
  const feed = value.elearning.discussionFeed;
  return Array.isArray(feed.items) && feed.items.every((item) => isObject(item) && typeof item.id === "string") &&
    typeof feed.page === "number" && typeof feed.size === "number" && typeof feed.totalItems === "number" && typeof feed.hasNext === "boolean";
}

function hasObjectField<TKey extends string, TField extends string>(key: TKey, field: TField) {
  return (value: unknown): value is Record<TKey, Record<TField, string>> =>
    isObject(value) && isObject(value[key]) && typeof value[key][field] === "string";
}

function mapPost(post: ElearningStudentDiscussionFeedQuery["elearning"]["discussionFeed"]["items"][number]): StudentDiscussionFeedPost {
  const createdAtMs = toTimestamp(post.createdAt);
  return {
    attachments: mapAttachments(post.attachmentIds),
    authorInitials: post.authorInitials || initials(post.authorName),
    authorName: post.authorName || "Học viên",
    className: post.className || post.academicClassId || "",
    comments: post.comments.map(mapComment),
    content: post.content || post.title || "",
    createdAtLabel: formatRelativeDate(createdAtMs),
    createdAtMs,
    id: post.id,
    reactions: mapReactionSummary(post.reactions),
    relatedAssignmentTitle: post.assignmentId || undefined,
    viewerReaction: asReaction(post.viewerReaction),
  };
}

function mapComment(comment: ElearningStudentDiscussionFeedQuery["elearning"]["discussionFeed"]["items"][number]["comments"][number]): StudentDiscussionComment {
  const createdAtMs = toTimestamp(comment.createdAt);
  return {
    attachments: mapAttachments(comment.attachmentIds),
    authorInitials: comment.authorInitials || initials(comment.authorName),
    authorName: comment.authorName || "Học viên",
    content: comment.content || "",
    createdAtLabel: formatRelativeDate(createdAtMs),
    createdAtMs,
    id: comment.id,
    reactions: mapReactionSummary(comment.reactions),
    replies: comment.replies.map((reply) => ({
      attachments: mapAttachments(reply.attachmentIds),
      authorInitials: reply.authorInitials || initials(reply.authorName),
      authorName: reply.authorName || "Học viên",
      content: reply.content || "",
      createdAtLabel: formatRelativeDate(toTimestamp(reply.createdAt)),
      createdAtMs: toTimestamp(reply.createdAt),
      id: reply.id,
      reactions: mapReactionSummary(reply.reactions),
      replies: [],
      viewerReaction: asReaction(reply.viewerReaction),
    })),
    viewerReaction: asReaction(comment.viewerReaction),
  };
}

function mapReactionSummary(rows: ReadonlyArray<{ readonly reaction: string; readonly count: number }>): StudentDiscussionReactionSummary {
  const summary = createReactionSummary();
  rows.forEach((row) => {
    const key = asReaction(row.reaction);
    if (key) summary[key] = { ...summary[key], count: Math.max(0, row.count) };
  });
  return summary;
}

function asReaction(value: string | null | undefined): StudentDiscussionReactionKey | null {
  return discussionReactionKeys.includes(value as StudentDiscussionReactionKey) ? value as StudentDiscussionReactionKey : null;
}

function mapAttachments(ids: ReadonlyArray<string>): StudentDiscussionImageAttachment[] {
  return ids.map((id) => ({ id, name: id, type: "image", url: "" }));
}

function toTimestamp(value: string | null | undefined) {
  const timestamp = value ? new Date(value).getTime() : Date.now();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function formatRelativeDate(timestamp: number) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  return minutes < 1 ? "Vừa xong" : minutes < 60 ? `${minutes} phút trước` : new Date(timestamp).toLocaleString("vi-VN");
}

function initials(name: string | null | undefined) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return words.length ? `${words[0][0]}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase() : "HV";
}
