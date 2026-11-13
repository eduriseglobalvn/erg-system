import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudentDiscussion,
  followStudentDiscussion,
  replyStudentDiscussion,
  setStudentDiscussionReaction,
} from "@/features/elearning/student-dashboard/api/student-engagement-api";
import {
  studentDiscussionFeedQueryOptions,
  studentEngagementQueryKeys,
  type StudentEngagementScope,
} from "@/features/elearning/student-dashboard/api/student-engagement-query";
import type {
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import type {
  DashboardCopy,
  StudentDiscussionNotification,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardProfile,
  StudentDiscussionImageAttachment,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  addFeedComment,
  createReactionSummary,
  toggleFeedCommentReaction,
  toggleFeedPostReaction,
} from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import {
  createInitialDiscussionFeedPosts,
  createInitialDiscussionNotifications,
  createTimestamp,
  getInitials,
  maskProfanity,
} from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

type DiscussionCommand = { apply: () => void; execute: () => Promise<unknown> };

export function useStudentDiscussion({
  apiEnabled,
  copy,
  engagementScope,
  fixtureMode,
  locale,
  profile,
  tenantId,
}: {
  apiEnabled: boolean;
  copy: DashboardCopy;
  engagementScope: StudentEngagementScope;
  fixtureMode: boolean;
  locale: string;
  profile: StudentDashboardProfile;
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const discussionFeedQuery = useQuery(studentDiscussionFeedQueryOptions(engagementScope));
  const [discussionPosts, setDiscussionPosts] = useState<StudentDiscussionFeedPost[]>([]);
  const [discussionNotifications, setDiscussionNotifications] = useState<StudentDiscussionNotification[]>([]);
  const justNow = locale === "vi" ? "Vua xong" : "Just now";

  useEffect(() => {
    if (!(import.meta.env.DEV && fixtureMode)) return;
    let cancelled = false;
    void import("@/test/fixtures/mock-student-dashboard").then(({ studentDiscussionThreads }) => {
      if (cancelled) return;
      const posts = createInitialDiscussionFeedPosts(studentDiscussionThreads);
      setDiscussionPosts(posts);
      setDiscussionNotifications(createInitialDiscussionNotifications(posts, locale));
    });
    return () => {
      cancelled = true;
    };
  }, [fixtureMode, locale]);

  useEffect(() => {
    if (!apiEnabled || !discussionFeedQuery.data) return;
    setDiscussionPosts(discussionFeedQuery.data.items);
  }, [apiEnabled, discussionFeedQuery.data]);

  const discussionCommandMutation = useMutation({
    mutationFn: (command: DiscussionCommand) => command.execute(),
    onError: (_error, _command, context) => {
      if (context?.previousPosts) setDiscussionPosts(context.previousPosts);
    },
    onMutate: (command: DiscussionCommand) => {
      const previousPosts = discussionPosts;
      command.apply();
      return { previousPosts };
    },
    onSettled: () => queryClient.invalidateQueries({
      exact: true,
      queryKey: studentEngagementQueryKeys.feed(engagementScope),
    }),
  });

  function runCommand(command: DiscussionCommand) {
    if (apiEnabled) discussionCommandMutation.mutate(command);
    else command.apply();
  }

  function pushDiscussionNotification(notification: StudentDiscussionNotification) {
    setDiscussionNotifications((currentNotifications) => [notification, ...currentNotifications].slice(0, 8));
  }

  function createDiscussionPost(content: string, attachments: StudentDiscussionImageAttachment[], subject?: string) {
    const now = createTimestamp();
    const safeContent = maskProfanity(content);
    const postId = `discussion-post-${now}`;
    const nextPost: StudentDiscussionFeedPost = {
      id: postId,
      content: safeContent.value,
      authorId: profile.id,
      authorName: profile.name,
      authorInitials: getInitials(profile.name),
      subject,
      createdAtLabel: justNow,
      createdAtMs: now,
      className: profile.className,
      attachments,
      moderationWarning: safeContent.hasProfanity,
      reactions: createReactionSummary(),
      comments: [],
      viewerReaction: null,
    };

    runCommand({
      apply: () => setDiscussionPosts((currentPosts) => [nextPost, ...currentPosts]),
      execute: () => createStudentDiscussion({
        attachmentIds: attachments.map((attachment) => attachment.id),
        content: safeContent.value,
        idempotencyKey: postId,
        subject,
        tenantId,
        title: safeContent.value.slice(0, 120) || copy.discussionTitle,
      }),
    });
    pushDiscussionNotification({
      id: `notification-${postId}`,
      primaryText: copy.notificationNewThread(nextPost.authorName),
      secondaryText: nextPost.content || copy.notificationImageOnly,
      replyId: undefined,
      threadId: postId,
      timeLabel: justNow,
      unread: true,
    });
  }

  function addDiscussionComment(
    postId: string,
    parentCommentId: string | undefined,
    content: string,
    attachments: StudentDiscussionImageAttachment[],
  ) {
    const safeContent = maskProfanity(content);
    const targetPost = discussionPosts.find((post) => post.id === postId);

    runCommand({
      apply: () => setDiscussionPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? addFeedComment({
                attachments,
                content: safeContent.value,
                createdAtLabel: justNow,
                moderationWarning: safeContent.hasProfanity,
                parentCommentId,
                post,
                viewer: {
                  id: profile.id,
                  initials: getInitials(profile.name),
                  name: profile.name,
                },
              })
            : post,
        ),
      ),
      execute: () => replyStudentDiscussion({
        attachmentIds: attachments.map((attachment) => attachment.id),
        content: safeContent.value,
        idempotencyKey: `reply-${postId}-${createTimestamp()}`,
        parentCommentId,
        postId,
        tenantId,
      }),
    });
    pushDiscussionNotification({
      id: `notification-comment-${postId}-${createTimestamp()}`,
      primaryText: copy.notificationNewReply(profile.name),
      secondaryText: copy.notificationTopicContext(targetPost?.content.slice(0, 80) ?? copy.discussionTitle),
      replyId: parentCommentId,
      threadId: postId,
      timeLabel: justNow,
      unread: true,
    });
  }

  function toggleDiscussionPostReaction(postId: string, reaction: StudentDiscussionReactionKey) {
    runCommand({
      apply: () => setDiscussionPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? toggleFeedPostReaction(post, reaction) : post)),
      ),
      execute: () => setStudentDiscussionReaction({ reaction, targetId: postId, targetType: "POST", tenantId }),
    });
  }

  function toggleDiscussionCommentReaction(postId: string, commentId: string, reaction: StudentDiscussionReactionKey) {
    runCommand({
      apply: () => setDiscussionPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? toggleFeedCommentReaction(post, commentId, reaction) : post)),
      ),
      execute: () => setStudentDiscussionReaction({ reaction, targetId: commentId, targetType: "COMMENT", tenantId }),
    });
  }

  function toggleDiscussionFollow(postId: string) {
    const follow = !discussionPosts.find((post) => post.id === postId)?.following;
    runCommand({
      apply: () => setDiscussionPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? { ...post, following: follow } : post)),
      ),
      execute: () => followStudentDiscussion({ follow, postId, tenantId }),
    });
  }

  // Own threads feed the "Của tôi" filter and the "Bạn" badge.
  const viewerPosts = useMemo(
    () => discussionPosts.map((post) => ({ ...post, mine: post.authorId === profile.id })),
    [discussionPosts, profile.id],
  );

  function markNotificationRead(threadId: string, replyId?: string) {
    setDiscussionNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.threadId === threadId && notification.replyId === replyId
          ? { ...notification, unread: false }
          : notification,
      ),
    );
  }

  return {
    addDiscussionComment,
    createDiscussionPost,
    discussionNotifications,
    discussionPosts: viewerPosts,
    markNotificationRead,
    toggleDiscussionCommentReaction,
    toggleDiscussionFollow,
    toggleDiscussionPostReaction,
  };
}
