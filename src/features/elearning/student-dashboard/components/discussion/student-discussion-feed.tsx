import { useMemo, useState } from "react";
import {
  Camera,
  Gift,
  Globe2,
  ImagePlus,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  SmilePlus,
  Sticker,
  X,
} from "lucide-react";
import { useForm } from "@tanstack/react-form";

import { SocialReactionAction, SocialReactionCountBadge, SocialReactionSummary } from "@/components/social-reactions";
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import { Button } from "@/components/ui/button";
import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import type {
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getCommentCount, getFeedPostActivityMs } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";
import { cn } from "@/lib/utils";

type DiscussionFeedCopy = {
  discussionAttachmentAction: string;
  discussionAttachmentHint: string;
  discussionDescription: string;
  discussionEmptyDescription: string;
  discussionEmptyTitle: string;
  discussionModerationWarning: string;
  discussionPostAction: string;
  discussionRelatedLabel: string;
  discussionRemoveAttachment: string;
  discussionReplyAction: string;
  discussionReplyPlaceholder: string;
  discussionTitle: string;
};

type DiscussionFeedProps = {
  copy: DiscussionFeedCopy;
  posts: StudentDiscussionFeedPost[];
  studentClass: string;
  studentName: string;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: StudentDiscussionReactionKey) => void;
  onCreatePost: (content: string, attachments: StudentDiscussionImageAttachment[]) => void;
  onPostReaction: (postId: string, reaction: StudentDiscussionReactionKey) => void;
};

export function StudentDiscussionFeed({
  copy,
  posts,
  studentClass,
  studentName,
  onAddComment,
  onCommentReaction,
  onCreatePost,
  onPostReaction,
}: DiscussionFeedProps) {
  const [postDraft, setPostDraft] = useState("");
  const [postAttachments, setPostAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const sortedPosts = useMemo(
    () => [...posts].sort((left, right) => getFeedPostActivityMs(right) - getFeedPostActivityMs(left)),
    [posts],
  );
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null;
  const firstName = studentName.trim().split(" ").slice(-1)[0] ?? studentName;
  const postForm = useForm({
    defaultValues: {
      content: postDraft,
    },
    onSubmit: () => {
      const content = postDraft.trim();
      if (!content && postAttachments.length === 0) return;

      onCreatePost(content, postAttachments);
      setPostDraft("");
      setPostAttachments([]);
      postForm.reset();
    },
  });

  async function handlePostAttachmentChange(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setPostAttachments((current) => [...current, ...nextAttachments]);
  }

  return (
    <section className="mx-auto w-full max-w-[1680px] px-4 py-5">
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,920px)_260px] 2xl:grid-cols-[280px_minmax(0,980px)_280px] xl:items-start xl:justify-center">
        <aside className="hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:block">
          <div className="text-xs font-semibold text-slate-400">ERG Social</div>
          <h1 className="mt-2 text-xl font-semibold leading-tight text-[#696CFF]">{copy.discussionTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.discussionDescription}</p>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-400">Lớp học</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{studentClass}</div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <TsForm
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void postForm.handleSubmit();
            }}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <Avatar initials={getInitials(studentName)} size="lg" />
              <button
                type="button"
                className="min-h-11 flex-1 rounded-full bg-slate-100 px-4 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-200"
                onClick={() => document.getElementById("student-discussion-post-box")?.focus()}
              >
                {firstName} ơi, bạn đang muốn hỏi gì?
              </button>
            </div>

            <div className="p-4">
              <postForm.Field
                name="content"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() || postAttachments.length > 0 ? undefined : "Nhập nội dung hoặc đính kèm ảnh trước khi đăng.",
                }}
              >
                {(field) => (
                  <>
                    <textarea
                      id="student-discussion-post-box"
                      className="min-h-24 w-full resize-none rounded-lg border border-transparent bg-white px-2 py-2 text-[15px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-200 focus:bg-slate-50"
                      placeholder="Chia sẻ câu hỏi, bài khó, mẹo học hoặc ảnh bài làm..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setPostDraft(event.target.value);
                      }}
                      aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                    />
                    <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                  </>
                )}
              </postForm.Field>
              <AttachmentPreview
                attachments={postAttachments}
                removeLabel={copy.discussionRemoveAttachment}
                onRemove={(attachmentId) =>
                  setPostAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
                }
              />
            </div>

            <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <AttachmentUploadButton
                hint={copy.discussionAttachmentHint}
                inputId="student-discussion-post-images"
                label={copy.discussionAttachmentAction}
                onChange={handlePostAttachmentChange}
              />
              <Button
                className="rounded-full bg-[#696CFF] px-5 text-white shadow-sm hover:bg-[#585BE0]"
                disabled={!postDraft.trim() && postAttachments.length === 0}
                type="submit"
              >
                <Send className="h-4 w-4" />
                {copy.discussionPostAction}
              </Button>
            </div>
          </TsForm>

          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                copy={copy}
                post={post}
                onAddComment={onAddComment}
                onCommentReaction={onCommentReaction}
                onOpenDetails={() => setSelectedPostId(post.id)}
                onPostReaction={onPostReaction}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-[#696CFF]">{copy.discussionEmptyTitle}</h2>
              <p className="mt-2 text-sm text-slate-500">{copy.discussionEmptyDescription}</p>
            </div>
          )}
        </div>

        <aside className="hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:block">
          <div className="text-sm font-semibold text-slate-950">Đang nổi bật</div>
          <div className="mt-3 space-y-3">
            {sortedPosts.slice(0, 3).map((post) => (
              <button key={post.id} className="block w-full rounded-lg bg-slate-50 p-3 text-left transition hover:bg-slate-100" type="button" onClick={() => setSelectedPostId(post.id)}>
                <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{post.content}</div>
                <div className="mt-2 text-xs text-slate-500">{getCommentCount(post.comments)} bình luận</div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {selectedPost ? (
        <PostDetailDialog
          copy={copy}
          post={selectedPost}
          studentName={studentName}
          onAddComment={onAddComment}
          onClose={() => setSelectedPostId(null)}
          onCommentReaction={onCommentReaction}
          onPostReaction={onPostReaction}
        />
      ) : null}
    </section>
  );
}

function PostCard({
  copy,
  post,
  onAddComment,
  onCommentReaction,
  onOpenDetails,
  onPostReaction,
}: {
  copy: DiscussionFeedCopy;
  post: StudentDiscussionFeedPost;
  onAddComment: DiscussionFeedProps["onAddComment"];
  onCommentReaction: DiscussionFeedProps["onCommentReaction"];
  onOpenDetails: () => void;
  onPostReaction: DiscussionFeedProps["onPostReaction"];
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAttachments, setCommentAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const reactionTotal = getReactionTotal(post.reactions);
  const commentCount = getCommentCount(post.comments);

  async function handleAttachmentChange(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setCommentAttachments((current) => [...current, ...nextAttachments]);
  }

  function submitComment() {
    const content = commentDraft.trim();
    if (!content && commentAttachments.length === 0) return;

    onAddComment(post.id, undefined, content, commentAttachments);
    setCommentDraft("");
    setCommentAttachments([]);
  }

  return (
    <article
      className="scroll-mt-24 overflow-visible rounded-lg border border-slate-200 bg-white shadow-sm"
      id={getPostDomId(post.id)}
    >
      <header className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 gap-3">
          <Avatar initials={post.authorInitials} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="font-semibold leading-5 text-slate-950">{post.authorName}</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-[#696CFF]">
                {post.className}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{post.createdAtLabel}</span>
              <Globe2 className="h-3.5 w-3.5" />
              {post.relatedAssignmentTitle ? <span>{copy.discussionRelatedLabel}: {post.relatedAssignmentTitle}</span> : null}
            </div>
          </div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" type="button">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <button className="block w-full px-4 pb-3 text-left" type="button" onClick={onOpenDetails}>
        <p className="whitespace-pre-line text-[15px] leading-7 text-slate-800">{post.content}</p>
        {post.moderationWarning ? <ModerationNotice copy={copy} /> : null}
        <AttachmentGrid attachments={post.attachments} />
      </button>

      <div className="mx-4 flex items-center justify-between border-y border-slate-100 py-2 text-sm text-slate-500">
        <SocialReactionSummary reactions={post.reactions} total={reactionTotal} />
        <span>{commentCount} bình luận · 62 lượt chia sẻ</span>
      </div>

      <div className="mx-2 grid grid-cols-3 gap-1 border-b border-slate-100 p-2">
        <SocialReactionAction activeReaction={post.viewerReaction} onReaction={(reaction) => onPostReaction(post.id, reaction)} />
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          type="button"
          onClick={onOpenDetails}
        >
          <MessageCircle className="h-4 w-4" />
          Bình luận
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100" type="button">
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </button>
      </div>

      <div className="space-y-3 bg-slate-50/70 p-4">
        {post.comments.slice(0, 3).map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            copy={copy}
            depth={1}
            postId={post.id}
            onAddComment={onAddComment}
            onCommentReaction={onCommentReaction}
          />
        ))}

        <div className="flex gap-2">
          <Avatar initials="VL" size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200 focus-within:ring-[#696CFF]/25">
              <input
                id={`comment-input-${post.id}`}
                className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                placeholder={copy.discussionReplyPlaceholder}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitComment();
                }}
              />
              <ComposerActionIcons />
              <AttachmentUploadButton compact inputId={`comment-image-${post.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
              <button
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#696CFF] text-white transition hover:bg-[#585BE0] disabled:bg-slate-300"
                disabled={!commentDraft.trim() && commentAttachments.length === 0}
                type="button"
                onClick={submitComment}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <AttachmentPreview
              compact
              attachments={commentAttachments}
              removeLabel={copy.discussionRemoveAttachment}
              onRemove={(attachmentId) =>
                setCommentAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
              }
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function PostDetailDialog({
  copy,
  post,
  studentName,
  onAddComment,
  onClose,
  onCommentReaction,
  onPostReaction,
}: {
  copy: DiscussionFeedCopy;
  post: StudentDiscussionFeedPost;
  studentName: string;
  onAddComment: DiscussionFeedProps["onAddComment"];
  onClose: () => void;
  onCommentReaction: DiscussionFeedProps["onCommentReaction"];
  onPostReaction: DiscussionFeedProps["onPostReaction"];
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [commentAttachments, setCommentAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const reactionTotal = getReactionTotal(post.reactions);
  const commentCount = getCommentCount(post.comments);

  async function handleAttachmentChange(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setCommentAttachments((current) => [...current, ...nextAttachments]);
  }

  function submitComment() {
    const content = commentDraft.trim();
    if (!content && commentAttachments.length === 0) return;

    onAddComment(post.id, undefined, content, commentAttachments);
    setCommentDraft("");
    setCommentAttachments([]);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-3 py-4 backdrop-blur-sm">
      <article className="flex max-h-[92vh] w-full max-w-[880px] flex-col overflow-hidden rounded-lg bg-white shadow-sm">
        <header className="relative shrink-0 border-b border-slate-200 px-14 py-3 text-center">
          <h2 className="line-clamp-2 text-lg font-medium leading-tight text-slate-950">Bài viết của {post.authorName}</h2>
          <button
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            type="button"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="flex min-w-0 gap-3">
              <Avatar initials={post.authorInitials} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold leading-5 text-slate-950">{post.authorName}</h3>
                  <span className="text-sm font-semibold text-[#696CFF]">· Theo dõi</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <span>{post.createdAtLabel}</span>
                  <span>·</span>
                  <Globe2 className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100" type="button">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 pb-4">
            <p className="whitespace-pre-line text-[15px] leading-7 text-slate-900">{post.content}</p>
            {post.moderationWarning ? <ModerationNotice copy={copy} /> : null}
          </div>

          <AttachmentGrid attachments={post.attachments} hero />

          <div className="mx-4 flex items-center justify-between border-y border-slate-200 py-2 text-sm text-slate-500">
            <SocialReactionSummary reactions={post.reactions} total={reactionTotal} />
            <div className="flex items-center gap-3">
              <span>{commentCount} bình luận</span>
              <span>62 lượt chia sẻ</span>
            </div>
          </div>

          <div className="mx-2 grid grid-cols-3 gap-1 border-b border-slate-100 p-2">
            <SocialReactionAction activeReaction={post.viewerReaction} onReaction={(reaction) => onPostReaction(post.id, reaction)} />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              type="button"
              onClick={() => document.getElementById(`modal-comment-input-${post.id}`)?.focus()}
            >
              <MessageCircle className="h-4 w-4" />
              Bình luận
            </button>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100" type="button">
              <Share2 className="h-4 w-4" />
              Chia sẻ
            </button>
          </div>

          <div className="space-y-3 bg-white px-4 py-4">
            <div className="text-sm font-semibold text-slate-500">Phù hợp nhất ▾</div>
            {post.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                copy={copy}
                depth={1}
                postId={post.id}
                onAddComment={onAddComment}
                onCommentReaction={onCommentReaction}
              />
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white p-3">
          <div className="flex gap-2">
            <Avatar initials={getInitials(studentName)} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex min-h-12 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                <input
                  id={`modal-comment-input-${post.id}`}
                  className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                  placeholder={`Bình luận dưới tên ${studentName}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitComment();
                  }}
                />
                <ComposerActionIcons />
                <AttachmentUploadButton compact inputId={`modal-comment-image-${post.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
                <button
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-[#696CFF] disabled:opacity-50"
                  disabled={!commentDraft.trim() && commentAttachments.length === 0}
                  type="button"
                  onClick={submitComment}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <AttachmentPreview
                compact
                attachments={commentAttachments}
                removeLabel={copy.discussionRemoveAttachment}
                onRemove={(attachmentId) =>
                  setCommentAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
                }
              />
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}

function CommentItem({
  comment,
  copy,
  depth,
  postId,
  onAddComment,
  onCommentReaction,
}: {
  comment: StudentDiscussionComment;
  copy: DiscussionFeedCopy;
  depth: number;
  postId: string;
  onAddComment: DiscussionFeedProps["onAddComment"];
  onCommentReaction: DiscussionFeedProps["onCommentReaction"];
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<StudentDiscussionImageAttachment[]>([]);
  const reactionTotal = getReactionTotal(comment.reactions);
  const nextDepth = Math.min(depth + 1, 3);

  async function handleAttachmentChange(files: FileList | null) {
    const nextAttachments = await createImageAttachments(files);
    setReplyAttachments((current) => [...current, ...nextAttachments]);
  }

  function submitReply() {
    const content = replyDraft.trim();
    if (!content && replyAttachments.length === 0) return;

    onAddComment(postId, comment.id, content, replyAttachments);
    setReplyDraft("");
    setReplyAttachments([]);
    setIsReplying(false);
  }

  return (
    <div
      className={cn(
        "relative flex gap-2",
        depth > 1 && "ml-7",
        comment.replies.length > 0 &&
          "before:absolute before:left-4 before:top-9 before:h-[calc(100%-2.25rem)] before:w-px before:bg-slate-200",
      )}
    >
      <Avatar initials={comment.authorInitials} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-lg bg-slate-100 px-3 py-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-950">
            <span>{comment.authorName}</span>
            {depth === 1 ? <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">Tác giả</span> : null}
          </div>
          <p className="mt-0.5 whitespace-pre-line text-sm leading-6 text-slate-700">{comment.content}</p>
          {comment.moderationWarning ? <ModerationNotice copy={copy} compact /> : null}
          <AttachmentGrid attachments={comment.attachments} compact />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3 px-2 text-xs font-semibold text-slate-500">
          <span>{comment.createdAtLabel}</span>
          <SocialReactionAction
            activeReaction={comment.viewerReaction}
            compact
            onReaction={(reaction) => onCommentReaction(postId, comment.id, reaction)}
          />
          <button className="transition hover:text-[#696CFF]" type="button" onClick={() => setIsReplying(!isReplying)}>
            {copy.discussionReplyAction}
          </button>
          <SocialReactionCountBadge reactions={comment.reactions} total={reactionTotal} />
        </div>

        {isReplying ? (
          <div className="mt-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 focus-within:ring-2 focus-within:ring-[#696CFF]/20">
              <input
                className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                placeholder={`Trả lời ${comment.authorName}...`}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitReply();
                }}
              />
              <ComposerActionIcons />
              <AttachmentUploadButton compact inputId={`reply-image-${comment.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
              <button
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#696CFF] text-white transition hover:bg-[#585BE0] disabled:bg-slate-300"
                disabled={!replyDraft.trim() && replyAttachments.length === 0}
                type="button"
                onClick={submitReply}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <AttachmentPreview
              compact
              attachments={replyAttachments}
              removeLabel={copy.discussionRemoveAttachment}
              onRemove={(attachmentId) =>
                setReplyAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
              }
            />
          </div>
        ) : null}

        {comment.replies.length > 0 ? (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                copy={copy}
                depth={nextDepth}
                postId={postId}
                onAddComment={onAddComment}
                onCommentReaction={onCommentReaction}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AttachmentUploadButton({
  compact,
  hint,
  inputId,
  label,
  onChange,
}: {
  compact?: boolean;
  hint?: string;
  inputId: string;
  label: string;
  onChange: (files: FileList | null) => void;
}) {
  if (compact) {
    return (
      <>
        <label className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-[#696CFF]" htmlFor={inputId} title={label}>
          <Camera className="h-4 w-4" />
        </label>
        <input
          accept="image/*"
          className="sr-only"
          id={inputId}
          multiple
          type="file"
          onChange={(event) => {
            onChange(event.target.files);
            event.target.value = "";
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        htmlFor={inputId}
      >
        <ImagePlus className="h-4 w-4" />
        {label}
      </label>
      <input
        accept="image/*"
        className="sr-only"
        id={inputId}
        multiple
        type="file"
        onChange={(event) => {
          onChange(event.target.files);
          event.target.value = "";
        }}
      />
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
  );
}

function ComposerActionIcons() {
  return (
    <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
      <button className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-[#696CFF]" type="button" title="Cảm xúc">
        <SmilePlus className="h-4 w-4" />
      </button>
      <button className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-[#696CFF]" type="button" title="GIF">
        <Gift className="h-4 w-4" />
      </button>
      <button className="grid h-7 w-7 place-items-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-[#696CFF]" type="button" title="Sticker">
        <Sticker className="h-4 w-4" />
      </button>
    </span>
  );
}

function AttachmentPreview({
  attachments,
  compact,
  removeLabel,
  onRemove,
}: {
  attachments: StudentDiscussionImageAttachment[];
  compact?: boolean;
  removeLabel: string;
  onRemove: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={cn("mt-3 grid gap-2", compact ? "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]" : "grid-cols-2")}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className={cn("group relative overflow-hidden rounded-lg bg-slate-100", compact ? "h-14" : "h-40")}>
          <img alt={attachment.name} className="h-full w-full object-cover" src={attachment.url} />
          <button
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-950/75 text-white opacity-90 transition hover:bg-slate-950"
            title={removeLabel}
            type="button"
            onClick={() => onRemove(attachment.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function AttachmentGrid({
  attachments,
  compact,
  hero,
}: {
  attachments: StudentDiscussionImageAttachment[];
  compact?: boolean;
  hero?: boolean;
}) {
  if (attachments.length === 0) return null;

  if (hero) {
    return (
      <div className="grid overflow-hidden border-y border-slate-200 bg-slate-100">
        {attachments.slice(0, 1).map((attachment) => (
          <a key={attachment.id} className="block max-h-[520px] bg-slate-950" href={attachment.url} rel="noreferrer" target="_blank">
            <img alt={attachment.name} className="mx-auto max-h-[520px] w-full object-cover" src={attachment.url} />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("mt-3 grid overflow-hidden rounded-lg border border-slate-200", compact ? "max-w-[260px] grid-cols-2" : "grid-cols-2")}>
      {attachments.slice(0, 4).map((attachment, index) => (
        <a key={attachment.id} className={cn("relative block bg-slate-100", compact ? "h-24" : "h-48")} href={attachment.url} rel="noreferrer" target="_blank">
          <img alt={attachment.name} className="h-full w-full object-cover" src={attachment.url} />
          {index === 3 && attachments.length > 4 ? (
            <span className="absolute inset-0 grid place-items-center bg-slate-950/55 text-xl font-semibold text-white">
              +{attachments.length - 4}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );
}

function ModerationNotice({ compact, copy }: { compact?: boolean; copy: DiscussionFeedCopy }) {
  return (
    <div className={cn("mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700", compact ? "text-[11px]" : "text-xs")}>
      {copy.discussionModerationWarning}
    </div>
  );
}

function Avatar({ initials, size }: { initials: string; size: "sm" | "lg" }) {
  return (
    <ShadcnAvatar className={cn("shrink-0 rounded-full ring-2 ring-white", size === "lg" ? "size-11" : "size-8")}>
      <AvatarFallback
        className={cn(
          "rounded-full bg-[#696CFF] font-semibold text-white",
          size === "lg" ? "text-sm" : "text-xs",
        )}
      >
        {initials}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function getReactionTotal(reactions: StudentDiscussionFeedPost["reactions"]) {
  return Object.values(reactions).reduce((total, reaction) => total + reaction.count, 0);
}

function getPostDomId(postId: string) {
  return `student-discussion-post-${postId}`;
}

function createImageAttachments(files: FileList | null) {
  const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));

  return Promise.all(
    imageFiles.map(
      (file, index) =>
        new Promise<StudentDiscussionImageAttachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `image-${Date.now()}-${index}-${file.name}`,
              type: "image",
              name: file.name,
              url: typeof reader.result === "string" ? reader.result : "",
            });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        }),
    ),
  );
}


