import { useState } from "react";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgEmptyState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgSelect } from "@/components/erg-mui/erg-form";
import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import type { GraphQlPortal } from "@/lib/graphql-client";
import {
  deleteDiscussionItem,
  discussionModerationKeys,
  loadModerationClasses,
  loadModerationFeed,
  setDiscussionItemHidden,
} from "@/features/elearning/discussion-moderation/api/discussion-moderation-api";
import { ModerationPostCard, type ModerationAction } from "@/features/elearning/discussion-moderation/components/discussion-moderation-items";

const DONE_MESSAGE: Record<ModerationAction["kind"], string> = {
  delete: "Đã xoá.",
  hide: "Đã ẩn. Học viên không còn thấy nội dung này.",
  show: "Đã hiện lại cho học viên.",
};

/** "Thảo luận" for Teacher (classes they teach) and Admin (every class of the tenant): view, hide, show again, delete. */
export function DiscussionModerationPage({ portal }: { portal: GraphQlPortal }) {
  const queryClient = useQueryClient();
  const [pickedClassId, setPickedClassId] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ModerationAction | null>(null);

  const classes = useQuery({
    queryKey: discussionModerationKeys.classes(portal),
    queryFn: ({ signal }) => loadModerationClasses(portal, signal),
  });
  const classId = pickedClassId || classes.data?.[0]?.id || "";
  const feed = useQuery({
    enabled: Boolean(classId),
    queryKey: discussionModerationKeys.feed(portal, classId),
    queryFn: ({ signal }) => loadModerationFeed(portal, classId, signal),
  });

  const moderate = useMutation({
    mutationFn: async (action: ModerationAction) => {
      if (action.kind === "delete") await deleteDiscussionItem(portal, action.targetType, action.targetId);
      else await setDiscussionItemHidden(portal, action.targetType, action.targetId, action.kind === "hide");
    },
    onSuccess: async (_result, action) => {
      setPendingDelete(null);
      toast.success(DONE_MESSAGE[action.kind]);
      await queryClient.invalidateQueries({ queryKey: discussionModerationKeys.feed(portal, classId) });
    },
  });

  function handleAction(action: ModerationAction) {
    if (action.kind === "delete") setPendingDelete(action);
    else moderate.mutate(action);
  }

  const posts = feed.data?.items ?? [];
  const loading = classes.isPending || (Boolean(classId) && feed.isPending);

  return (
    <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 2, md: 0 }, py: { xs: 2, md: 3 } }}>
      <ErgPageHeader title="Thảo luận" description="Bài viết và bình luận của học viên theo lớp. Nội dung đã ẩn chỉ giáo viên và quản trị thấy." />
      {classes.data?.length ? (
        <ErgSelect
          label="Lớp"
          onChange={(event) => setPickedClassId(String(event.target.value))}
          options={classes.data.map((item) => ({ label: item.name || item.id, value: item.id }))}
          size="small"
          sx={{ maxWidth: 360, mb: 2 }}
          value={classId}
        />
      ) : null}
      {loading ? (
        <Stack spacing={2}>
          <ErgSkeleton height={160} />
          <ErgSkeleton height={160} />
        </Stack>
      ) : !classId ? (
        <ErgEmptyState icon={<ForumRoundedIcon />} title="Chưa có lớp nào" description="Bạn chưa phụ trách lớp nào có thảo luận của học viên." />
      ) : posts.length ? (
        <Stack spacing={2}>
          {posts.map((post) => <ModerationPostCard key={post.id} post={post} onAction={handleAction} />)}
        </Stack>
      ) : (
        <ErgEmptyState icon={<ForumRoundedIcon />} title="Chưa có bài viết" description="Học viên lớp này chưa đăng bài thảo luận nào." />
      )}
      <ErgConfirmDialog
        confirmLabel="Xoá"
        description={pendingDelete?.targetType === "POST"
          ? "Bài viết cùng mọi bình luận của nó sẽ bị xoá vĩnh viễn."
          : "Bình luận cùng các câu trả lời của nó sẽ bị xoá vĩnh viễn."}
        destructive
        loading={moderate.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && moderate.mutate(pendingDelete)}
        open={Boolean(pendingDelete)}
        title={pendingDelete?.targetType === "POST" ? "Xoá bài viết?" : "Xoá bình luận?"}
      />
    </Box>
  );
}

export function TeacherDiscussionModerationRoute() {
  return <DiscussionModerationPage portal="lms" />;
}

export function AdminDiscussionModerationRoute() {
  return <DiscussionModerationPage portal="lcms" />;
}
