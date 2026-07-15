import Box from "@mui/material/Box";
import { useMemo, useState } from "react";
import Camera from "@mui/icons-material/PhotoCameraRounded";
import Gift from "@mui/icons-material/GifBoxRounded";
import Globe2 from "@mui/icons-material/PublicRounded";
import ImagePlus from "@mui/icons-material/AddPhotoAlternateRounded";
import MessageCircle from "@mui/icons-material/ChatBubbleOutlineRounded";
import MoreHorizontal from "@mui/icons-material/MoreHorizRounded";
import Send from "@mui/icons-material/SendRounded";
import Share2 from "@mui/icons-material/ShareRounded";
import SmilePlus from "@mui/icons-material/AddReactionRounded";
import Sticker from "@mui/icons-material/StickyNote2Rounded";
import X from "@mui/icons-material/CloseRounded";
import { useForm } from "@tanstack/react-form";

import MuiAvatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";

import { SocialReactionAction, SocialReactionCountBadge, SocialReactionSummary } from "@/components/social-reactions";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import type { StudentDiscussionImageAttachment } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import type {
  StudentDiscussionComment,
  StudentDiscussionFeedPost,
  StudentDiscussionReactionKey,
} from "@/features/elearning/student-dashboard/types/discussion-feed-types";
import { getCommentCount, getFeedPostActivityMs } from "@/features/elearning/student-dashboard/utils/discussion-feed-state";

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
    <Box component="section" sx={{"marginInline":"auto","width":"100%","maxWidth":"1680px","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 5)"}}>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xl: "260px minmax(0,920px) 260px", "2xl": "280px minmax(0,980px) 280px" }, justifyContent: { xl: "center" }, alignItems: { xl: "start" } }}>
        <Box component="aside" sx={{"display":"none","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media ((min-width: 80rem))":{"display":"block"}}}>
          <Box component="div" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>ERG Social</Box>
          <Box component="h1" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"1.25rem","lineHeight":"1.25","fontWeight":"600","color":"#696CFF"}}>{copy.discussionTitle}</Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(44.6% 0.043 257.281)"}}>{copy.discussionDescription}</Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 4)","borderRadius":"0.5rem","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 3)"}}>
            <Box component="div" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(70.4% 0.04 256.788)"}}>Lớp học</Box>
            <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{studentClass}</Box>
          </Box>
        </Box>

        <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)",":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 4) * 0)","marginBlockEnd":"calc(calc(0.25rem * 4) * calc(1 - 0))"}}}>
          <Box component={TsForm}
            sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, boxShadow: 1, overflow: "hidden" }}
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void postForm.handleSubmit();
            }}
          >
            <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","padding":"calc(0.25rem * 4)"}}>
              <Avatar initials={getInitials(studentName)} size="lg" />
              <Box component="button"
                type="button"
                sx={{"minHeight":"calc(0.25rem * 11)","flex":"1","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 4)","textAlign":"left","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"500","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)"}}}}
                onClick={() => document.getElementById("student-discussion-post-box")?.focus()}
              >
                {firstName} ơi, bạn đang muốn hỏi gì?
              </Box>
            </Box>

            <Box component="div" sx={{"padding":"calc(0.25rem * 4)"}}>
              <postForm.Field
                name="content"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() || postAttachments.length > 0 ? undefined : "Nhập nội dung hoặc đính kèm ảnh trước khi đăng.",
                }}
              >
                {(field) => (
                  <>
                    <Box component="textarea"
                      id="student-discussion-post-box"
                      sx={{"minHeight":"calc(0.25rem * 24)","width":"100%","resize":"none","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"transparent","backgroundColor":"#fff","paddingInline":"calc(0.25rem * 2)","paddingBlock":"calc(0.25rem * 2)","fontSize":"15px","lineHeight":"calc(0.25rem * 7)","color":"oklch(27.9% 0.041 260.031)","outlineStyle":"none","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&::placeholder":{"color":"oklch(70.4% 0.04 256.788)"},"&:focus":{"borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(98.4% 0.003 247.858)"}}}
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
            </Box>

            <Box component="div" sx={{"display":"grid","gap":"calc(0.25rem * 3)","borderTopStyle":"solid","borderTopWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","padding":"calc(0.25rem * 4)","@media ((min-width: 40rem))":{"gridTemplateColumns":"1fr auto","alignItems":"center"}}}>
              <AttachmentUploadButton
                hint={copy.discussionAttachmentHint}
                inputId="student-discussion-post-images"
                label={copy.discussionAttachmentAction}
                onChange={handlePostAttachmentChange}
              />
              <Button
                variant="contained"
                startIcon={<Send sx={{ fontSize: 16 }} />}
                sx={{"borderRadius":"9999px","backgroundColor":"#696CFF","paddingInline":"calc(0.25rem * 5)","color":"#fff","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","&:hover":{"@media ((hover: hover))":{"backgroundColor":"#585BE0"}}}}
                disabled={!postDraft.trim() && postAttachments.length === 0}
                type="submit"
              >
                {copy.discussionPostAction}
              </Button>
            </Box>
          </Box>

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
            <Box component="div" sx={{"borderRadius":"0.5rem","borderStyle":"dashed","borderWidth":"1px","borderColor":"oklch(86.9% 0.022 252.894)","backgroundColor":"#fff","padding":"calc(0.25rem * 10)","textAlign":"center"}}>
              <Box component="h2" sx={{"fontSize":"1.125rem","lineHeight":"calc(1.75 / 1.125)","fontWeight":"600","color":"#696CFF"}}>{copy.discussionEmptyTitle}</Box>
              <Box component="p" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>{copy.discussionEmptyDescription}</Box>
            </Box>
          )}
        </Box>

        <Box component="aside" sx={{"display":"none","borderRadius":"0.5rem","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 4)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)","@media ((min-width: 80rem))":{"display":"block"}}}>
          <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>Đang nổi bật</Box>
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)",":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
            {sortedPosts.slice(0, 3).map((post) => (
              <Box component="button" key={post.id} sx={{"display":"block","width":"100%","borderRadius":"0.5rem","backgroundColor":"oklch(98.4% 0.003 247.858)","padding":"calc(0.25rem * 3)","textAlign":"left","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}} type="button" onClick={() => setSelectedPostId(post.id)}>
                <Box component="div" sx={{"overflow":"hidden","display":"-webkit-box","WebkitBoxOrient":"vertical","WebkitLineClamp":"2","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 5)","fontWeight":"600","color":"oklch(20.8% 0.042 265.755)"}}>{post.content}</Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>{getCommentCount(post.comments)} bình luận</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

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
    </Box>
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
    <Box component="article"
      sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 1, boxShadow: 1, overflow: "visible", scrollMarginTop: 96 }}
      id={getPostDomId(post.id)}
    >
      <Box component="header" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)","padding":"calc(0.25rem * 4)"}}>
        <Box component="div" sx={{"display":"flex","minWidth":"calc(0.25rem * 0)","gap":"calc(0.25rem * 3)"}}>
          <Avatar initials={post.authorInitials} size="lg" />
          <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
            <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","columnGap":"calc(0.25rem * 2)","rowGap":"calc(0.25rem * 1)"}}>
              <Box component="h2" sx={{"fontWeight":"600","lineHeight":"calc(0.25rem * 5)","color":"oklch(12.9% 0.042 264.695)"}}>{post.authorName}</Box>
              <Box component="span" sx={{"borderRadius":"0.375rem","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 2)","paddingBlock":"calc(0.25rem * 0.5)","fontSize":"11px","fontWeight":"600","color":"#696CFF"}}>
                {post.className}
              </Box>
            </Box>
            <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>
              <span>{post.createdAtLabel}</span>
              <Globe2 sx={{ fontSize: 14 }} />
              {post.relatedAssignmentTitle ? <span>{copy.discussionRelatedLabel}: {post.relatedAssignmentTitle}</span> : null}
            </Box>
          </Box>
        </Box>
        <Box component="button" sx={{"display":"grid","height":"calc(0.25rem * 9)","width":"calc(0.25rem * 9)","placeItems":"center","borderRadius":"9999px","color":"oklch(70.4% 0.04 256.788)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)","color":"oklch(37.2% 0.044 257.287)"}}}} type="button">
          <MoreHorizontal sx={{ fontSize: 20 }} />
        </Box>
      </Box>

      <Box component="button" sx={{"display":"block","width":"100%","paddingInline":"calc(0.25rem * 4)","paddingBottom":"calc(0.25rem * 3)","textAlign":"left"}} type="button" onClick={onOpenDetails}>
        <Box component="p" sx={{"whiteSpace":"pre-line","fontSize":"15px","lineHeight":"calc(0.25rem * 7)","color":"oklch(27.9% 0.041 260.031)"}}>{post.content}</Box>
        {post.moderationWarning ? <ModerationNotice copy={copy} /> : null}
        <AttachmentGrid attachments={post.attachments} />
      </Box>

      <Box component="div" sx={{"marginInline":"calc(0.25rem * 4)","display":"flex","alignItems":"center","justifyContent":"space-between","borderBlockStyle":"solid","borderBlockWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","paddingBlock":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>
        <SocialReactionSummary reactions={post.reactions} total={reactionTotal} />
        <span>{commentCount} bình luận · 62 lượt chia sẻ</span>
      </Box>

      <Box component="div" sx={{"marginInline":"calc(0.25rem * 2)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 1)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","padding":"calc(0.25rem * 2)"}}>
        <SocialReactionAction activeReaction={post.viewerReaction} onReaction={(reaction) => onPostReaction(post.id, reaction)} />
        <Box component="button"
          sx={{"display":"inline-flex","height":"calc(0.25rem * 10)","alignItems":"center","justifyContent":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}}
          type="button"
          onClick={onOpenDetails}
        >
          <MessageCircle sx={{ fontSize: 16 }} />
          Bình luận
        </Box>
        <Box component="button" sx={{"display":"inline-flex","height":"calc(0.25rem * 10)","alignItems":"center","justifyContent":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}} type="button">
          <Share2 sx={{ fontSize: 16 }} />
          Chia sẻ
        </Box>
      </Box>

      <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"},"backgroundColor":"color-mix(in srgb, oklch(98.4% 0.003 247.858) 70%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(98.4% 0.003 247.858) 70%, transparent)"},"padding":"calc(0.25rem * 4)"}}>
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

        <Box component="div" sx={{"display":"flex","gap":"calc(0.25rem * 2)"}}>
          <Avatar initials="VL" size="sm" />
          <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
            <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","backgroundColor":"#fff","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)","boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(1px + 0px) currentcolor, 0 0 #0000","&:focus-within":{}}}>
              <Box component="input"
                id={`comment-input-${post.id}`}
                sx={{"height":"calc(0.25rem * 8)","minWidth":"calc(0.25rem * 0)","flex":"1","backgroundColor":"transparent","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","outlineStyle":"none","&::placeholder":{"color":"oklch(70.4% 0.04 256.788)"}}}
                placeholder={copy.discussionReplyPlaceholder}
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitComment();
                }}
              />
              <ComposerActionIcons />
              <AttachmentUploadButton compact inputId={`comment-image-${post.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
              <Box component="button"
                sx={{"display":"grid","height":"calc(0.25rem * 8)","width":"calc(0.25rem * 8)","flexShrink":"0","placeItems":"center","borderRadius":"9999px","backgroundColor":"#696CFF","color":"#fff","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"#585BE0"}},"&:disabled":{"backgroundColor":"oklch(86.9% 0.022 252.894)"}}}
                disabled={!commentDraft.trim() && commentAttachments.length === 0}
                type="button"
                onClick={submitComment}
              >
                <Send sx={{ fontSize: 16 }} />
              </Box>
            </Box>
            <AttachmentPreview
              compact
              attachments={commentAttachments}
              removeLabel={copy.discussionRemoveAttachment}
              onRemove={(attachmentId) =>
                setCommentAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
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
    <Box component="div" sx={{"position":"fixed","inset":"calc(0.25rem * 0)","zIndex":"50","display":"grid","placeItems":"center","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 55%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 55%, transparent)"},"paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 4)","WebkitBackdropFilter":"blur(8px)        ","backdropFilter":"blur(8px)        "}}>
      <Box component="article" sx={{ bgcolor: "background.paper", borderRadius: 1, boxShadow: 1, display: "flex", flexDirection: "column", maxHeight: "92vh", maxWidth: 880, overflow: "hidden", width: "100%" }}>
        <Box component="header" sx={{"position":"relative","flexShrink":"0","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingInline":"calc(0.25rem * 14)","paddingBlock":"calc(0.25rem * 3)","textAlign":"center"}}>
          <Box component="h2" sx={{"overflow":"hidden","display":"-webkit-box","WebkitBoxOrient":"vertical","WebkitLineClamp":"2","fontSize":"1.125rem","lineHeight":"1.25","fontWeight":"500","color":"oklch(12.9% 0.042 264.695)"}}>Bài viết của {post.authorName}</Box>
          <Box component="button"
            sx={{"position":"absolute","right":"calc(0.25rem * 3)","top":"calc(1 / 2 * 100%)","display":"grid","height":"calc(0.25rem * 10)","width":"calc(0.25rem * 10)","translate":"0 calc(calc(1 / 2 * 100%) * -1)","placeItems":"center","borderRadius":"9999px","backgroundColor":"oklch(96.8% 0.007 247.896)","color":"oklch(37.2% 0.044 257.287)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)"}}}}
            type="button"
            onClick={onClose}
          >
            <X sx={{ fontSize: 24 }} />
          </Box>
        </Box>

        <Box component="div" sx={{"minHeight":"calc(0.25rem * 0)","flex":"1","overflowY":"auto"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"flex-start","justifyContent":"space-between","gap":"calc(0.25rem * 3)","padding":"calc(0.25rem * 4)"}}>
            <Box component="div" sx={{"display":"flex","minWidth":"calc(0.25rem * 0)","gap":"calc(0.25rem * 3)"}}>
              <Avatar initials={post.authorInitials} size="lg" />
              <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)"}}>
                <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
                  <Box component="h3" sx={{"fontWeight":"600","lineHeight":"calc(0.25rem * 5)","color":"oklch(12.9% 0.042 264.695)"}}>{post.authorName}</Box>
                  <Box component="span" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"#696CFF"}}>· Theo dõi</Box>
                </Box>
                <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","display":"flex","alignItems":"center","gap":"calc(0.25rem * 1)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>
                  <span>{post.createdAtLabel}</span>
                  <span>·</span>
                  <Globe2 sx={{ fontSize: 14 }} />
                </Box>
              </Box>
            </Box>
            <Box component="button" sx={{"display":"grid","height":"calc(0.25rem * 9)","width":"calc(0.25rem * 9)","placeItems":"center","borderRadius":"9999px","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}} type="button">
              <MoreHorizontal sx={{ fontSize: 20 }} />
            </Box>
          </Box>

          <Box component="div" sx={{"paddingInline":"calc(0.25rem * 4)","paddingBottom":"calc(0.25rem * 4)"}}>
            <Box component="p" sx={{"whiteSpace":"pre-line","fontSize":"15px","lineHeight":"calc(0.25rem * 7)","color":"oklch(20.8% 0.042 265.755)"}}>{post.content}</Box>
            {post.moderationWarning ? <ModerationNotice copy={copy} /> : null}
          </Box>

          <AttachmentGrid attachments={post.attachments} hero />

          <Box component="div" sx={{"marginInline":"calc(0.25rem * 4)","display":"flex","alignItems":"center","justifyContent":"space-between","borderBlockStyle":"solid","borderBlockWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","paddingBlock":"calc(0.25rem * 2)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","color":"oklch(55.4% 0.046 257.417)"}}>
            <SocialReactionSummary reactions={post.reactions} total={reactionTotal} />
            <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 3)"}}>
              <span>{commentCount} bình luận</span>
              <span>62 lượt chia sẻ</span>
            </Box>
          </Box>

          <Box component="div" sx={{"marginInline":"calc(0.25rem * 2)","display":"grid","gridTemplateColumns":"repeat(3, minmax(0, 1fr))","gap":"calc(0.25rem * 1)","borderBottomStyle":"solid","borderBottomWidth":"1px","borderColor":"oklch(96.8% 0.007 247.896)","padding":"calc(0.25rem * 2)"}}>
            <SocialReactionAction activeReaction={post.viewerReaction} onReaction={(reaction) => onPostReaction(post.id, reaction)} />
            <Box component="button"
              sx={{"display":"inline-flex","height":"calc(0.25rem * 10)","alignItems":"center","justifyContent":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}}
              type="button"
              onClick={() => document.getElementById(`modal-comment-input-${post.id}`)?.focus()}
            >
              <MessageCircle sx={{ fontSize: 16 }} />
              Bình luận
            </Box>
            <Box component="button" sx={{"display":"inline-flex","height":"calc(0.25rem * 10)","alignItems":"center","justifyContent":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(44.6% 0.043 257.281)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(96.8% 0.007 247.896)"}}}} type="button">
              <Share2 sx={{ fontSize: 16 }} />
              Chia sẻ
            </Box>
          </Box>

          <Box component="div" sx={{":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"},"backgroundColor":"#fff","paddingInline":"calc(0.25rem * 4)","paddingBlock":"calc(0.25rem * 4)"}}>
            <Box component="div" sx={{"fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>Phù hợp nhất ▾</Box>
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
          </Box>
        </Box>

        <Box component="footer" sx={{"flexShrink":"0","borderTopStyle":"solid","borderTopWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"#fff","padding":"calc(0.25rem * 3)"}}>
          <Box component="div" sx={{"display":"flex","gap":"calc(0.25rem * 2)"}}>
            <Avatar initials={getInitials(studentName)} size="sm" />
            <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
              <Box component="div" sx={{"display":"flex","minHeight":"calc(0.25rem * 12)","alignItems":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)"}}>
                <Box component="input"
                  id={`modal-comment-input-${post.id}`}
                  sx={{"height":"calc(0.25rem * 8)","minWidth":"calc(0.25rem * 0)","flex":"1","backgroundColor":"transparent","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","outlineStyle":"none","&::placeholder":{"color":"oklch(55.4% 0.046 257.417)"}}}
                  placeholder={`Bình luận dưới tên ${studentName}`}
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitComment();
                  }}
                />
                <ComposerActionIcons />
                <AttachmentUploadButton compact inputId={`modal-comment-image-${post.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
                <Box component="button"
                  sx={{"display":"grid","height":"calc(0.25rem * 8)","width":"calc(0.25rem * 8)","flexShrink":"0","placeItems":"center","borderRadius":"9999px","color":"oklch(70.4% 0.04 256.788)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)","color":"#696CFF"}},"&:disabled":{"opacity":"50%"}}}
                  disabled={!commentDraft.trim() && commentAttachments.length === 0}
                  type="button"
                  onClick={submitComment}
                >
                  <Send sx={{ fontSize: 16 }} />
                </Box>
              </Box>
              <AttachmentPreview
                compact
                attachments={commentAttachments}
                removeLabel={copy.discussionRemoveAttachment}
                onRemove={(attachmentId) =>
                  setCommentAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
                }
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
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
    <Box sx={{ display: "flex", gap: 1, ml: depth > 1 ? 3.5 : 0, position: "relative", ...(comment.replies.length > 0 ? { "&::before": { bgcolor: "divider", content: '\"\"', height: "calc(100% - 2.25rem)", left: 16, position: "absolute", top: 36, width: 1 } } : {}) }}>
      <Avatar initials={comment.authorInitials} size="sm" />
      <Box component="div" sx={{"minWidth":"calc(0.25rem * 0)","flex":"1"}}>
        <Box component="div" sx={{"display":"inline-block","maxWidth":"100%","borderRadius":"0.5rem","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)"}}>
          <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 1.5)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(12.9% 0.042 264.695)"}}>
            <span>{comment.authorName}</span>
            {depth === 1 ? <Box component="span" sx={{"borderRadius":"0.25rem","backgroundColor":"oklch(92.9% 0.013 255.508)","paddingInline":"calc(0.25rem * 1.5)","paddingBlock":"calc(0.25rem * 0.5)","fontSize":"10px","color":"oklch(44.6% 0.043 257.281)"}}>Tác giả</Box> : null}
          </Box>
          <Box component="p" sx={{"marginTop":"calc(0.25rem * 0.5)","whiteSpace":"pre-line","fontSize":"0.875rem","lineHeight":"calc(0.25rem * 6)","color":"oklch(37.2% 0.044 257.287)"}}>{comment.content}</Box>
          {comment.moderationWarning ? <ModerationNotice copy={copy} compact /> : null}
          <AttachmentGrid attachments={comment.attachments} compact />
        </Box>

        <Box component="div" sx={{"marginTop":"calc(0.25rem * 1)","display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 3)","paddingInline":"calc(0.25rem * 2)","fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","fontWeight":"600","color":"oklch(55.4% 0.046 257.417)"}}>
          <span>{comment.createdAtLabel}</span>
          <SocialReactionAction
            activeReaction={comment.viewerReaction}
            compact
            onReaction={(reaction) => onCommentReaction(postId, comment.id, reaction)}
          />
          <Box component="button" sx={{"transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"color":"#696CFF"}}}} type="button" onClick={() => setIsReplying(!isReplying)}>
            {copy.discussionReplyAction}
          </Box>
          <SocialReactionCountBadge reactions={comment.reactions} total={reactionTotal} />
        </Box>

        {isReplying ? (
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 2)"}}>
            <Box component="div" sx={{"display":"flex","alignItems":"center","gap":"calc(0.25rem * 2)","borderRadius":"0.5rem","backgroundColor":"oklch(96.8% 0.007 247.896)","paddingInline":"calc(0.25rem * 3)","paddingBlock":"calc(0.25rem * 2)","&:focus-within":{"boxShadow":"0 0 #0000, 0 0 #0000, 0 0 #0000,  0 0 0 calc(2px + 0px) currentcolor, 0 0 #0000"}}}>
              <Box component="input"
                sx={{"height":"calc(0.25rem * 8)","minWidth":"calc(0.25rem * 0)","flex":"1","backgroundColor":"transparent","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","outlineStyle":"none","&::placeholder":{"color":"oklch(55.4% 0.046 257.417)"}}}
                placeholder={`Trả lời ${comment.authorName}...`}
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitReply();
                }}
              />
              <ComposerActionIcons />
              <AttachmentUploadButton compact inputId={`reply-image-${comment.id}`} label={copy.discussionAttachmentAction} onChange={handleAttachmentChange} />
              <Box component="button"
                sx={{"display":"grid","height":"calc(0.25rem * 8)","width":"calc(0.25rem * 8)","flexShrink":"0","placeItems":"center","borderRadius":"9999px","backgroundColor":"#696CFF","color":"#fff","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"#585BE0"}},"&:disabled":{"backgroundColor":"oklch(86.9% 0.022 252.894)"}}}
                disabled={!replyDraft.trim() && replyAttachments.length === 0}
                type="button"
                onClick={submitReply}
              >
                <Send sx={{ fontSize: 16 }} />
              </Box>
            </Box>
            <AttachmentPreview
              compact
              attachments={replyAttachments}
              removeLabel={copy.discussionRemoveAttachment}
              onRemove={(attachmentId) =>
                setReplyAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
              }
            />
          </Box>
        ) : null}

        {comment.replies.length > 0 ? (
          <Box component="div" sx={{"marginTop":"calc(0.25rem * 3)",":where(& > :not(:last-child))":{"marginBlockStart":"calc(calc(0.25rem * 3) * 0)","marginBlockEnd":"calc(calc(0.25rem * 3) * calc(1 - 0))"}}}>
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
          </Box>
        ) : null}
      </Box>
    </Box>
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
        <Box component="label" sx={{"display":"grid","height":"calc(0.25rem * 8)","width":"calc(0.25rem * 8)","flexShrink":"0","cursor":"pointer","placeItems":"center","borderRadius":"9999px","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)","color":"#696CFF"}}}} htmlFor={inputId} title={label}>
          <Camera sx={{ fontSize: 16 }} />
        </Box>
        <Box component="input"
          accept="image/*"
          sx={{"position":"absolute","width":"1px","height":"1px","padding":"0","margin":"-1px","overflow":"hidden","clipPath":"inset(50%)","whiteSpace":"nowrap","borderWidth":"0"}}
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
    <Box component="div" sx={{"display":"flex","flexWrap":"wrap","alignItems":"center","gap":"calc(0.25rem * 2)"}}>
      <Box component="label"
        sx={{"display":"inline-flex","height":"calc(0.25rem * 10)","cursor":"pointer","alignItems":"center","gap":"calc(0.25rem * 2)","borderRadius":"9999px","borderStyle":"solid","borderWidth":"1px","borderColor":"oklch(90.5% 0.093 164.15)","backgroundColor":"oklch(97.9% 0.021 166.113)","paddingInline":"calc(0.25rem * 4)","fontSize":"0.875rem","lineHeight":"calc(1.25 / 0.875)","fontWeight":"600","color":"oklch(50.8% 0.118 165.612)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(95% 0.052 163.051)"}}}}
        htmlFor={inputId}
      >
        <ImagePlus sx={{ fontSize: 16 }} />
        {label}
      </Box>
      <Box component="input"
        accept="image/*"
        sx={{"position":"absolute","width":"1px","height":"1px","padding":"0","margin":"-1px","overflow":"hidden","clipPath":"inset(50%)","whiteSpace":"nowrap","borderWidth":"0"}}
        id={inputId}
        multiple
        type="file"
        onChange={(event) => {
          onChange(event.target.files);
          event.target.value = "";
        }}
      />
      {hint ? <Box component="span" sx={{"fontSize":"0.75rem","lineHeight":"calc(1 / 0.75)","color":"oklch(55.4% 0.046 257.417)"}}>{hint}</Box> : null}
    </Box>
  );
}

function ComposerActionIcons() {
  return (
    <Box component="span" sx={{"display":"none","flexShrink":"0","alignItems":"center","gap":"calc(0.25rem * 1)","@media ((min-width: 40rem))":{"display":"inline-flex"}}}>
      <Box component="button" sx={{"display":"grid","height":"calc(0.25rem * 7)","width":"calc(0.25rem * 7)","placeItems":"center","borderRadius":"9999px","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)","color":"#696CFF"}}}} type="button" title="Cảm xúc">
        <SmilePlus sx={{ fontSize: 16 }} />
      </Box>
      <Box component="button" sx={{"display":"grid","height":"calc(0.25rem * 7)","width":"calc(0.25rem * 7)","placeItems":"center","borderRadius":"9999px","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)","color":"#696CFF"}}}} type="button" title="GIF">
        <Gift sx={{ fontSize: 16 }} />
      </Box>
      <Box component="button" sx={{"display":"grid","height":"calc(0.25rem * 7)","width":"calc(0.25rem * 7)","placeItems":"center","borderRadius":"9999px","color":"oklch(55.4% 0.046 257.417)","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(92.9% 0.013 255.508)","color":"#696CFF"}}}} type="button" title="Sticker">
        <Sticker sx={{ fontSize: 16 }} />
      </Box>
    </Box>
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
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: compact ? "repeat(auto-fill,minmax(56px,1fr))" : "repeat(2,minmax(0,1fr))", mt: 1.5 }}>
      {attachments.map((attachment) => (
        <Box key={attachment.id} sx={{ bgcolor: "#f1f5f9", borderRadius: 1, height: compact ? 56 : 160, overflow: "hidden", position: "relative" }}>
          <Box component="img" alt={attachment.name} sx={{"height":"100%","width":"100%","objectFit":"cover"}} src={attachment.url} />
          <Box component="button"
            sx={{"position":"absolute","right":"calc(0.25rem * 2)","top":"calc(0.25rem * 2)","display":"grid","height":"calc(0.25rem * 7)","width":"calc(0.25rem * 7)","placeItems":"center","borderRadius":"9999px","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 75%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 75%, transparent)"},"color":"#fff","opacity":"90%","transitionProperty":"color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events","transitionTimingFunction":"cubic-bezier(0.4, 0, 0.2, 1)","transitionDuration":"150ms","&:hover":{"@media ((hover: hover))":{"backgroundColor":"oklch(12.9% 0.042 264.695)"}}}}
            title={removeLabel}
            type="button"
            onClick={() => onRemove(attachment.id)}
          >
            <X sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      ))}
    </Box>
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
      <Box component="div" sx={{"display":"grid","overflow":"hidden","borderBlockStyle":"solid","borderBlockWidth":"1px","borderColor":"oklch(92.9% 0.013 255.508)","backgroundColor":"oklch(96.8% 0.007 247.896)"}}>
        {attachments.slice(0, 1).map((attachment) => (
          <Box component="a" key={attachment.id} sx={{"display":"block","maxHeight":"520px","backgroundColor":"oklch(12.9% 0.042 264.695)"}} href={attachment.url} rel="noreferrer" target="_blank">
            <Box component="img" alt={attachment.name} sx={{"marginInline":"auto","maxHeight":"520px","width":"100%","objectFit":"cover"}} src={attachment.url} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", maxWidth: compact ? 260 : undefined, mt: 1.5, overflow: "hidden" }}>
      {attachments.slice(0, 4).map((attachment, index) => (
        <Box component="a" key={attachment.id} sx={{ bgcolor: "#f1f5f9", display: "block", height: compact ? 96 : 192, position: "relative" }} href={attachment.url} rel="noreferrer" target="_blank">
          <Box component="img" alt={attachment.name} sx={{"height":"100%","width":"100%","objectFit":"cover"}} src={attachment.url} />
          {index === 3 && attachments.length > 4 ? (
            <Box component="span" sx={{"position":"absolute","inset":"calc(0.25rem * 0)","display":"grid","placeItems":"center","backgroundColor":"color-mix(in srgb, oklch(12.9% 0.042 264.695) 55%, transparent)","@supports (color: color-mix(in lab, red, red))":{"backgroundColor":"color-mix(in oklab, oklch(12.9% 0.042 264.695) 55%, transparent)"},"fontSize":"1.25rem","lineHeight":"calc(1.75 / 1.25)","fontWeight":"600","color":"#fff"}}>
              +{attachments.length - 4}
            </Box>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

function ModerationNotice({ compact, copy }: { compact?: boolean; copy: DiscussionFeedCopy }) {
  return (
    <Box sx={{ bgcolor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 1, color: "#b45309", fontSize: compact ? 11 : 12, fontWeight: 600, mt: 1, px: 1.5, py: 1 }}>
      {copy.discussionModerationWarning}
    </Box>
  );
}

function Avatar({ initials, size }: { initials: string; size: "sm" | "lg" }) {
  const dimension = size === "lg" ? 44 : 32;

  return (
    <MuiAvatar
      sx={{
        flexShrink: 0,
        width: dimension,
        height: dimension,
        bgcolor: "#696CFF",
        color: "#fff",
        fontWeight: 600,
        fontSize: size === "lg" ? 14 : 12,
        boxShadow: "0 0 0 2px #fff",
      }}
    >
      {initials}
    </MuiAvatar>
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


