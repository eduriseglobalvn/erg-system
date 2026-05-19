import { apiRequest } from "@/lib/api-client";
import type { SocialReactionKey } from "@/types/social-reactions";

export type CommunityTopicDTO = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  groupName: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isFeatured: boolean;
  threadCount: number;
  postCount: number;
  followerCount: number;
  lastPostId?: string;
  lastPostAt?: string;
  isFollowing: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommunityMediaDTO = {
  id?: string;
  type: "image" | "video";
  url: string;
  storageKey?: string;
  thumbnailUrl?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSec?: number;
  sortOrder?: number;
};

export type CommunityReactionSummaryDTO = Record<SocialReactionKey, number> & {
  total: number;
};

export type CommunityAuthorDTO = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  verified: boolean;
};

export type CommunityPostDTO = {
  id: string;
  topicId: string;
  topicSlug?: string;
  topicName?: string;
  author: CommunityAuthorDTO;
  title?: string;
  content: string;
  postType: "discussion" | "question" | "review" | "share" | "case" | "video" | "resource";
  status: "open" | "answered" | "mentor-needed" | "resource" | "closed";
  visibility: "public" | "community" | "private";
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  shareCount: number;
  viewerReaction?: SocialReactionKey;
  reactions: CommunityReactionSummaryDTO;
  media: CommunityMediaDTO[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunityCommentDTO = {
  id: string;
  postId: string;
  parentId?: string;
  rootId?: string;
  author: CommunityAuthorDTO;
  content: string;
  depth: number;
  replyCount: number;
  reactionCount: number;
  viewerReaction?: SocialReactionKey;
  reactions: CommunityReactionSummaryDTO;
  replies?: CommunityCommentDTO[];
  createdAt: string;
  updatedAt: string;
};

export type PaginatedCommunityPosts = {
  data: CommunityPostDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListCommunityPostsParams = {
  topic?: string;
  topicId?: string;
  q?: string;
  status?: string;
  sort?: "active" | "newest";
  page?: number;
  limit?: number;
};

export type CreateCommunityPostPayload = {
  topicId?: string;
  topicSlug?: string;
  title?: string;
  content: string;
  postType?: CommunityPostDTO["postType"];
  status?: CommunityPostDTO["status"];
  visibility?: CommunityPostDTO["visibility"];
  tags?: string[];
  media?: CommunityMediaDTO[];
};

export type CreateCommunityCommentPayload = {
  content: string;
  parentId?: string;
};

export async function loadCommunityTopics() {
  return apiRequest<CommunityTopicDTO[]>("/api/hoclieu/community/topics");
}

export async function loadCommunityPosts(params: ListCommunityPostsParams = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiRequest<PaginatedCommunityPosts>(`/api/hoclieu/community/feed${suffix}`);
}

export async function createCommunityPost(payload: CreateCommunityPostPayload) {
  return apiRequest<CommunityPostDTO>("/api/hoclieu/community/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadCommunityMedia(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<{ media: CommunityMediaDTO }>("/api/hoclieu/community/media/upload", {
    method: "POST",
    body: form,
  });
}

export async function loadCommunityComments(postId: string, limit = 50) {
  return apiRequest<CommunityCommentDTO[]>(
    `/api/hoclieu/community/posts/${encodeURIComponent(postId)}/comments?limit=${limit}`,
  );
}

export async function createCommunityComment(postId: string, payload: CreateCommunityCommentPayload) {
  return apiRequest<CommunityCommentDTO>(`/api/hoclieu/community/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setCommunityReaction(targetType: "post" | "comment", targetId: string, reaction: SocialReactionKey | null) {
  return apiRequest<CommunityReactionSummaryDTO>("/api/hoclieu/community/reactions", {
    method: reaction ? "PUT" : "DELETE",
    body: JSON.stringify({ targetType, targetId, reaction: reaction ?? "" }),
  });
}

export async function setCommunityFollow(targetType: "topic" | "user", targetId: string, following: boolean) {
  return apiRequest<{ following: boolean }>("/api/hoclieu/community/follows", {
    method: following ? "POST" : "DELETE",
    body: JSON.stringify({ targetType, targetId }),
  });
}
