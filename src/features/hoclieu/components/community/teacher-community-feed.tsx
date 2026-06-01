import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  ImagePlus,
  Layers3,
  MessageCircle,
  MoreHorizontal,
  Pin,
  PlusCircle,
  Search,
  Send,
  Share2,
  Sparkles,
  Tags,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";

import { SocialReactionAction, SocialReactionCountBadge, SocialReactionSummary } from "@/components/social-reactions";
import { TeacherAuthDialog } from "@/features/auth/components/teacher-auth-dialog";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import type { TeacherAccount } from "@/features/auth/types/auth-types";
import {
  createCommunityComment,
  createCommunityPost,
  loadCommunityPosts,
  loadCommunityTopics,
  setCommunityFollow,
  setCommunityReaction,
  uploadCommunityMedia,
  type CreateCommunityCommentPayload,
  type CommunityPostDTO,
  type CommunityTopicDTO,
} from "@/features/hoclieu/api/community-api";
import { socialReactionKeys, viSocialReactionLabels, type SocialReactionKey, type SocialReactionSummary as ReactionSummaryState } from "@/types/social-reactions";
import { cn } from "@/lib/utils";

type CommunityAttachment = {
  id: string;
  mimeType?: string;
  name: string;
  storageKey?: string;
  type: "image" | "video";
  url: string;
};

type TeacherCommunityAuthor = {
  avatarUrl?: string;
  initials: string;
  name: string;
  role: string;
  verified?: boolean;
};

type TeacherCommunityComment = {
  id: string;
  author: TeacherCommunityAuthor;
  content: string;
  createdAtLabel: string;
  createdAtMs: number;
  reactions: ReactionSummaryState;
  replies: TeacherCommunityComment[];
  viewerReaction: SocialReactionKey | null;
};

type TeacherCommunityPost = {
  id: string;
  author: TeacherCommunityAuthor;
  channel: string;
  content: string;
  createdAtLabel: string;
  createdAtMs: number;
  attachments: CommunityAttachment[];
  comments: TeacherCommunityComment[];
  pinned?: boolean;
  resourceTitle?: string;
  status?: "open" | "answered" | "mentor-needed" | "resource";
  tags?: string[];
  threadType?: "question" | "review" | "share" | "case" | "video";
  title?: string;
  views?: number;
  viewerReaction: SocialReactionKey | null;
  reactions: ReactionSummaryState;
};

const fallbackTeacher: TeacherCommunityAuthor = {
  initials: "VT",
  name: "Vương Trần",
  role: "Giáo viên Tiếng Anh",
  verified: true,
};

const guestTeacher: TeacherCommunityAuthor = {
  initials: "ERG",
  name: "Khách cộng đồng",
  role: "Đăng nhập để tham gia",
};

const communityChannels = [
  { label: "Bảng tin giáo viên", count: "1.2k bài mới", icon: Users },
  { label: "Review bài giảng", count: "12 mentor online", icon: Sparkles },
  { label: "Kho chia sẻ", count: "348 tài nguyên", icon: FileText },
  { label: "Video tiết dạy", count: "56 recording", icon: Video },
];

const forumTabs = [
  { key: "all", label: "Tất cả", icon: Layers3 },
  { key: "mentor-needed", label: "Cần mentor", icon: Clock3 },
  { key: "answered", label: "Đã giải quyết", icon: CheckCircle2 },
  { key: "resource", label: "Tài nguyên", icon: Bookmark },
] as const;

type ForumTabKey = (typeof forumTabs)[number]["key"];

type ForumBoard = {
  channel: string;
  description: string;
  group: string;
  latestLabel: string;
  messages: number;
  threads: number;
};

const forumBoards: ForumBoard[] = [
  {
    channel: "Bảng tin giáo viên",
    description: "Trao đổi chung, hỏi nhanh, thông báo nội bộ và kinh nghiệm vận hành lớp.",
    group: "Đại sảnh giáo viên",
    latestLabel: "Quy trình lưu tài sản sau khi mentor review",
    messages: 4280,
    threads: 382,
  },
  {
    channel: "Review bài giảng",
    description: "Đăng lesson flow, slide, worksheet để mentor và đồng nghiệp góp ý.",
    group: "Chuyên môn & học liệu",
    latestLabel: "Unit 8 - Getting Started cần rút hoạt động nào?",
    messages: 1894,
    threads: 246,
  },
  {
    channel: "Kho chia sẻ",
    description: "Tài nguyên đã dùng được: rubric, checklist, template, hoạt động nhóm.",
    group: "Chuyên môn & học liệu",
    latestLabel: "Mẫu thẻ nhiệm vụ phân tầng cho lớp đông",
    messages: 3175,
    threads: 511,
  },
  {
    channel: "Video tiết dạy",
    description: "Video demo, recording tiết dạy, phân tích góc máy và hoạt động lớp.",
    group: "Media & minh chứng",
    latestLabel: "Hai góc quay cho hoạt động STEM 15 phút",
    messages: 762,
    threads: 118,
  },
  {
    channel: "Tình huống lớp học",
    description: "Case quản lớp, học sinh lệch trình độ, xử lý hành vi và giữ nhịp tiết học.",
    group: "Hỏi đáp & xử lý tình huống",
    latestLabel: "Nhóm làm nhanh mất tập trung khi chờ bạn khác",
    messages: 983,
    threads: 154,
  },
  {
    channel: "Đánh giá & kiểm tra",
    description: "Đề kiểm tra, ma trận, rubric, nhận xét học sinh và phản hồi phụ huynh.",
    group: "Hỏi đáp & xử lý tình huống",
    latestLabel: "Rubric speaking 4 mức cho học sinh lớp 6",
    messages: 1240,
    threads: 207,
  },
];

const channelDescriptions: Record<string, string> = {
  "Báº£ng tin giÃ¡o viÃªn": "Thảo luận chung",
  "Review bÃ i giáº£ng": "Xin góp ý lesson flow",
  "Kho chia sáº»": "Tài sản dùng lại",
  "Video tiáº¿t dáº¡y": "Clip lớp học",
};

const sampleImages = [
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
];

const sampleVideos = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
];

function imageAttachment(id: string, index: number): CommunityAttachment {
  return {
    id,
    name: id,
    type: "image",
    url: sampleImages[index % sampleImages.length],
  };
}

function videoAttachment(id: string, index: number): CommunityAttachment {
  return {
    id,
    name: id,
    type: "video",
    url: sampleVideos[index % sampleVideos.length],
  };
}

const initialPosts: TeacherCommunityPost[] = [
  {
    id: "teacher-post-lesson-review",
    author: {
      initials: "MN",
      name: "Mai Ngọc Anh",
      role: "Mentor Global Success 6",
      verified: true,
    },
    channel: "Review bài giảng",
    content:
      "Mình vừa chỉnh lại lesson flow cho Unit 8 - Getting Started. Phần warm-up dùng ảnh tình huống thật giúp học sinh nói nhiều hơn, nhưng đoạn practice vẫn hơi dài. Thầy cô góp ý giúp mình nên rút hoạt động nào để tiết 45 phút không bị đuối nhé.",
    createdAtLabel: "18 phút",
    createdAtMs: Date.now() - 18 * 60 * 1000,
    attachments: [
      {
        id: "lesson-flow",
        name: "lesson-flow-preview",
        type: "image",
        url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    comments: [
      {
        id: "comment-review-1",
        author: {
          initials: "TL",
          name: "Trần Linh",
          role: "Giáo viên THCS",
        },
        content: "Mình sẽ giữ phần pair work, rút bớt controlled practice và chuyển 2 câu cuối thành bài về nhà.",
        createdAtLabel: "12 phút",
        createdAtMs: Date.now() - 12 * 60 * 1000,
        reactions: createReactionSummary({ like: 2, love: 1 }),
        replies: [
          {
            id: "comment-review-1-reply",
            author: fallbackTeacher,
            content: "Đúng ý mình đang cần. Nếu thêm exit ticket 2 phút cuối thì mentor dễ đo được học sinh nắm bài tới đâu.",
            createdAtLabel: "5 phút",
            createdAtMs: Date.now() - 5 * 60 * 1000,
            reactions: createReactionSummary({ care: 1 }),
            replies: [],
            viewerReaction: null,
          },
        ],
        viewerReaction: null,
      },
    ],
    pinned: true,
    resourceTitle: "Global Success 6 - Unit 8 lesson kit",
    viewerReaction: null,
    reactions: createReactionSummary({ like: 24, love: 8, care: 5, wow: 2 }),
  },
  {
    id: "teacher-post-two-images",
    author: {
      initials: "TL",
      name: "Trần Linh",
      role: "Giáo viên THCS",
    },
    channel: "Kho chia sẻ",
    content: "Mình gửi 2 ảnh before/after của bảng hoạt động nhóm. Cách chia cột mới giúp học sinh yếu bắt nhịp nhanh hơn.",
    createdAtLabel: "32 phút",
    createdAtMs: Date.now() - 32 * 60 * 1000,
    attachments: [imageAttachment("two-images-1", 1), imageAttachment("two-images-2", 2)],
    comments: [],
    resourceTitle: "Before / After board setup",
    viewerReaction: null,
    reactions: createReactionSummary({ like: 18, love: 4 }),
  },
  {
    id: "teacher-post-three-images",
    author: {
      initials: "HA",
      name: "Hoàng An",
      role: "Tổ trưởng chuyên môn",
      verified: true,
    },
    channel: "Review bài giảng",
    content: "3 ảnh này là flow mở bài, hoạt động chính và exit ticket. Thầy cô xem giúp phần chuyển ý giữa ảnh 1 và ảnh 2 đã tự nhiên chưa.",
    createdAtLabel: "45 phút",
    createdAtMs: Date.now() - 45 * 60 * 1000,
    attachments: [imageAttachment("three-images-1", 3), imageAttachment("three-images-2", 4), imageAttachment("three-images-3", 5)],
    comments: [],
    viewerReaction: null,
    reactions: createReactionSummary({ like: 21, care: 3, wow: 2 }),
  },
  {
    id: "teacher-post-four-images",
    author: {
      initials: "PN",
      name: "Phương Nhi",
      role: "Giáo viên Tiểu học",
    },
    channel: "Bảng tin giáo viên",
    content: "Một bộ 4 ảnh góc học tập sau khi setup lại: bảng nhiệm vụ, góc đọc, nhóm thực hành và khu trưng bày sản phẩm.",
    createdAtLabel: "56 phút",
    createdAtMs: Date.now() - 56 * 60 * 1000,
    attachments: [
      imageAttachment("four-images-1", 0),
      imageAttachment("four-images-2", 1),
      imageAttachment("four-images-3", 6),
      imageAttachment("four-images-4", 7),
    ],
    comments: [],
    viewerReaction: null,
    reactions: createReactionSummary({ like: 34, love: 9 }),
  },
  {
    id: "teacher-post-many-images",
    author: {
      initials: "QH",
      name: "Quốc Huy",
      role: "Giáo viên Toán",
    },
    channel: "Kho chia sẻ",
    content: "Album 7 ảnh hoạt động trạm. Layout cần hiện 5 ảnh đầu và báo số ảnh còn lại để giáo viên biết có thể mở thêm.",
    createdAtLabel: "1 giờ",
    createdAtMs: Date.now() - 68 * 60 * 1000,
    attachments: Array.from({ length: 7 }, (_, index) => imageAttachment(`many-images-${index + 1}`, index)),
    comments: [],
    viewerReaction: null,
    reactions: createReactionSummary({ like: 42, love: 6, care: 3 }),
  },
  {
    id: "teacher-post-video-images",
    author: {
      initials: "MN",
      name: "Mai Ngọc Anh",
      role: "Mentor Global Success 6",
      verified: true,
    },
    channel: "Video tiết dạy",
    content: "Một video ngắn kèm nhiều ảnh chụp hoạt động. Video nên được ưu tiên ô lớn, ảnh phụ nằm cạnh để nhìn giống social feed.",
    createdAtLabel: "1 giờ",
    createdAtMs: Date.now() - 76 * 60 * 1000,
    attachments: [
      videoAttachment("video-with-images-1", 0),
      imageAttachment("video-with-images-2", 2),
      imageAttachment("video-with-images-3", 4),
      imageAttachment("video-with-images-4", 6),
      imageAttachment("video-with-images-5", 7),
      imageAttachment("video-with-images-6", 1),
    ],
    comments: [],
    viewerReaction: null,
    reactions: createReactionSummary({ like: 28, wow: 8, care: 4 }),
  },
  {
    id: "teacher-post-two-videos",
    author: {
      initials: "DT",
      name: "Đức Tâm",
      role: "Giáo viên STEM",
    },
    channel: "Video tiết dạy",
    content: "2 video quay cùng một hoạt động từ hai góc máy. Layout hai video cần chia đều, không kéo méo khung.",
    createdAtLabel: "2 giờ",
    createdAtMs: Date.now() - 118 * 60 * 1000,
    attachments: [videoAttachment("two-videos-1", 0), videoAttachment("two-videos-2", 1)],
    comments: [],
    viewerReaction: null,
    reactions: createReactionSummary({ like: 19, wow: 5 }),
  },
  {
    id: "teacher-post-classroom-case",
    author: {
      initials: "QH",
      name: "Quốc Huy",
      role: "Giáo viên Toán",
    },
    channel: "Tình huống lớp học",
    content:
      "Lớp mình có nhóm học sinh làm bài rất nhanh nhưng hay mất tập trung khi chờ các bạn khác. Thầy cô có hoạt động mở rộng ngắn nào giữ các em vẫn trong mạch bài không?",
    createdAtLabel: "1 giờ",
    createdAtMs: Date.now() - 60 * 60 * 1000,
    attachments: [],
    comments: [
      {
        id: "comment-case-1",
        author: {
          initials: "HA",
          name: "Hoàng An",
          role: "Tổ trưởng chuyên môn",
          verified: true,
        },
        content: "Bạn thử chuẩn bị thẻ nhiệm vụ phân tầng. Nhóm nhanh nhận thẻ giải thích lỗi sai thường gặp, nhóm còn lại tiếp tục bài chính.",
        createdAtLabel: "42 phút",
        createdAtMs: Date.now() - 42 * 60 * 1000,
        reactions: createReactionSummary({ like: 4 }),
        replies: [],
        viewerReaction: null,
      },
    ],
    resourceTitle: "Mẫu thẻ nhiệm vụ phân tầng",
    viewerReaction: "care",
    reactions: createReactionSummary({ like: 13, care: 7, haha: 1 }),
  },
];

export function TeacherCommunityFeed() {
  const auth = useAuthSession();
  const [posts, setPosts] = useState<TeacherCommunityPost[]>(initialPosts);
  const [apiTopics, setApiTopics] = useState<CommunityTopicDTO[]>([]);
  const [draft, setDraft] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("Bảng tin giáo viên");
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<ForumTabKey>("all");
  const [followedChannels, setFollowedChannels] = useState<string[]>(["Review bài giảng", "Kho chia sẻ"]);
  const [followedUsers, setFollowedUsers] = useState<string[]>(["Mai Ngọc Anh"]);
  const [attachments, setAttachments] = useState<CommunityAttachment[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [hasAutoOpenedLoginGate, setHasAutoOpenedLoginGate] = useState(false);
  const [loginGateOpen, setLoginGateOpen] = useState(false);
  const isAuthenticated = Boolean(auth.account);
  const viewerTeacher = useMemo(() => teacherAuthorFromAccount(auth.account), [auth.account]);
  const forumTopicRows = useMemo(() => normalizeForumBoards(apiTopics), [apiTopics]);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const sortedPosts = useMemo(() => {
    return [...posts]
      .filter((post) => activeChannel === "all" || post.channel === activeChannel)
      .filter((post) => activeTab === "all" || getForumStatus(post) === activeTab)
      .filter((post) => !normalizedSearchQuery || matchesCommunitySearch(post, normalizedSearchQuery))
      .sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || right.createdAtMs - left.createdAtMs);
  }, [activeChannel, activeTab, normalizedSearchQuery, posts]);
  const allThreadCount = posts.length;
  const mentorThreadCount = posts.filter((post) => getForumStatus(post) === "mentor-needed").length;
  const answeredThreadCount = posts.filter((post) => getForumStatus(post) === "answered").length;
  const resourceThreadCount = posts.filter((post) => getForumStatus(post) === "resource").length;
  const visiblePosts = useMemo(
    () => (isAuthenticated ? sortedPosts : getHotPosts(sortedPosts).slice(0, 4)),
    [isAuthenticated, sortedPosts],
  );
  const hasLockedFeed = !isAuthenticated && sortedPosts.length > visiblePosts.length;
  const communityHydrationQuery = useQuery({
    queryKey: ["hoclieu", "community", "bootstrap"],
    queryFn: async () => {
      const [topics, feed] = await Promise.all([loadCommunityTopics(), loadCommunityPosts({ limit: 30 })]);
      return {
        topics,
        posts: feed.data.map(communityPostToTeacherPost),
      };
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
  const uploadMediaMutation = useMutation({
    mutationKey: ["hoclieu", "community", "media-upload"],
    mutationFn: uploadCommunityMedia,
  });
  const createPostMutation = useMutation({
    mutationKey: ["hoclieu", "community", "create-post"],
    mutationFn: createCommunityPost,
  });
  const createCommentMutation = useMutation({
    mutationKey: ["hoclieu", "community", "create-comment"],
    mutationFn: ({ postId, payload }: { postId: string; payload: CreateCommunityCommentPayload }) =>
      createCommunityComment(postId, payload),
  });
  const reactionMutation = useMutation({
    mutationKey: ["hoclieu", "community", "reaction"],
    mutationFn: ({ targetType, targetId, reaction }: { targetType: "post" | "comment"; targetId: string; reaction: SocialReactionKey | null }) =>
      setCommunityReaction(targetType, targetId, reaction),
  });
  const followMutation = useMutation({
    mutationKey: ["hoclieu", "community", "follow"],
    mutationFn: ({ targetType, targetId, following }: { targetType: "topic" | "user"; targetId: string; following: boolean }) =>
      setCommunityFollow(targetType, targetId, following),
  });

  useEffect(() => {
    if (!communityHydrationQuery.data) return;

    setApiTopics(communityHydrationQuery.data.topics);
    if (communityHydrationQuery.data.posts.length > 0) {
      setPosts(communityHydrationQuery.data.posts);
    }
  }, [communityHydrationQuery.data]);

  useEffect(() => {
    if (isAuthenticated || !hasLockedFeed || hasAutoOpenedLoginGate) return;
    const timer = window.setTimeout(() => {
      setLoginGateOpen(true);
      setHasAutoOpenedLoginGate(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [hasAutoOpenedLoginGate, hasLockedFeed, isAuthenticated]);

  async function handleAttachmentChange(files: FileList | null) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    const nextAttachments = await createImageAttachments(files, (file) => uploadMediaMutation.mutateAsync(file));
    setAttachments((current) => [...current, ...nextAttachments]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    const content = draft.trim();
    if (isPosting || (!content && attachments.length === 0)) return;

    const now = Date.now();
    const optimisticPost: TeacherCommunityPost = {
      id: `teacher-post-${now}`,
      author: viewerTeacher,
      channel: selectedChannel,
      content,
      createdAtLabel: "Vừa xong",
      createdAtMs: now,
      attachments,
      comments: [],
      status: selectedChannel.includes("Review") ? "mentor-needed" : attachments.length > 0 ? "resource" : "open",
      tags: inferTagsFromChannel(selectedChannel),
      threadType: inferThreadTypeFromChannel(selectedChannel),
      title: topicTitle.trim() || createThreadTitle(content, selectedChannel),
      views: 1,
      viewerReaction: null,
      reactions: createReactionSummary(),
    };

    setPosts((current) => [optimisticPost, ...current]);
    setDraft("");
    setTopicTitle("");
    setAttachments([]);

    setIsPosting(true);
    try {
      const saved = await createPostMutation.mutateAsync({
        content,
        media: attachments.map((item, index) => ({
          id: item.id,
          mimeType: item.mimeType,
          originalName: item.name,
          sortOrder: index,
          storageKey: item.storageKey,
          type: item.type,
          url: item.url,
        })),
        postType: inferThreadTypeFromChannel(selectedChannel),
        status: optimisticPost.status,
        tags: optimisticPost.tags,
        title: optimisticPost.title,
        topicId: topicIdForChannel(apiTopics, selectedChannel),
        topicSlug: topicSlugForChannel(selectedChannel),
      });
      setPosts((current) => current.map((post) => (post.id === optimisticPost.id ? communityPostToTeacherPost(saved) : post)));
    } catch {
      // Keep the optimistic post in the feed so the user never loses a draft
      // because the API is temporarily unavailable.
    } finally {
      setIsPosting(false);
    }
  }

  function toggleChannelFollow(channel: string) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    setFollowedChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );
    const topicId = topicIdForChannel(apiTopics, channel);
    if (topicId) {
      void followMutation.mutateAsync({ targetType: "topic", targetId: topicId, following: !followedChannels.includes(channel) });
    }
  }

  function toggleUserFollow(name: string) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    setFollowedUsers((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  }

  function togglePostReaction(postId: string, reaction: SocialReactionKey) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    const currentPost = posts.find((post) => post.id === postId);
    const nextReaction = currentPost?.viewerReaction === reaction ? null : reaction;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              viewerReaction: post.viewerReaction === reaction ? null : reaction,
              reactions: toggleReactionSummary(post.reactions, post.viewerReaction, reaction),
            }
          : post,
      ),
    );
    void reactionMutation.mutateAsync({ targetType: "post", targetId: postId, reaction: nextReaction });
  }

  function addComment(postId: string, parentCommentId: string | undefined, content: string) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const optimisticComment: TeacherCommunityComment = {
      id: `teacher-comment-${Date.now()}`,
      author: viewerTeacher,
      content: trimmedContent,
      createdAtLabel: "Vừa xong",
      createdAtMs: Date.now(),
      reactions: createReactionSummary(),
      replies: [],
      viewerReaction: null,
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? addCommentToPost(post, parentCommentId, optimisticComment)
          : post,
      ),
    );
    void createCommentMutation.mutateAsync({ postId, payload: { content: trimmedContent, parentId: parentCommentId } });
  }

  function toggleCommentReaction(postId: string, commentId: string, reaction: SocialReactionKey) {
    if (!isAuthenticated) {
      setLoginGateOpen(true);
      return;
    }
    const comment = findComment(posts.find((post) => post.id === postId)?.comments ?? [], commentId);
    const nextReaction = comment?.viewerReaction === reaction ? null : reaction;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: updateComments(post.comments, commentId, (comment) => ({
                ...comment,
                viewerReaction: comment.viewerReaction === reaction ? null : reaction,
                reactions: toggleReactionSummary(comment.reactions, comment.viewerReaction, reaction),
              })),
            }
          : post,
      ),
    );
    void reactionMutation.mutateAsync({ targetType: "comment", targetId: commentId, reaction: nextReaction });
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-14 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1680px] gap-3 px-4 py-5 lg:grid-cols-[minmax(240px,auto)_minmax(320px,560px)_auto] lg:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Cộng đồng giáo viên</h1>
            <p className="mt-1 text-sm text-slate-500">Hỏi đáp, review bài giảng và chia sẻ tài nguyên Học liệu.</p>
          </div>
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-slate-100 px-4 text-slate-500 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-[var(--erg-blue)]/20">
            <Search className="h-4 w-4 shrink-0" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="Tìm bài viết, tag, chuyên mục..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery ? (
              <button
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 lg:justify-end">
            <MiniForumStat label="thread" value={allThreadCount} />
            <MiniForumStat label="cần mentor" value={mentorThreadCount} />
            <MiniForumStat label="đã giải quyết" value={answeredThreadCount} />
            <MiniForumStat label="tài nguyên" value={resourceThreadCount} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1680px] gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,900px)_320px] 2xl:grid-cols-[300px_minmax(0,980px)_340px]">
        <aside className="hidden space-y-4 xl:block">
          <Panel className="p-2">
            <button
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                activeChannel === "all" ? "bg-[var(--erg-blue)] text-white" : "hover:bg-slate-100",
              )}
              type="button"
              onClick={() => setActiveChannel("all")}
            >
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", activeChannel === "all" ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600")}>
                <Layers3 className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">Tất cả chuyên mục</span>
                <span className={cn("block truncate text-xs", activeChannel === "all" ? "text-white/75" : "text-slate-500")}>{allThreadCount} thread</span>
              </span>
            </button>
            {communityChannels.map((channel) => {
              const Icon = channel.icon;
              const isActive = activeChannel === channel.label;
              const channelCount = posts.filter((post) => post.channel === channel.label).length;
              return (
                <button
                  key={channel.label}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                    isActive ? "bg-[var(--erg-blue)] text-white" : "hover:bg-slate-100",
                  )}
                  type="button"
                  onClick={() => setActiveChannel(channel.label)}
                >
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl", isActive ? "bg-white/15 text-white" : "bg-[var(--erg-blue)]/8 text-[var(--erg-blue)]")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-sm font-bold", isActive ? "text-white" : "text-slate-900")}>{channel.label}</span>
                    <span className={cn("block truncate text-xs", isActive ? "text-white/75" : "text-slate-500")}>
                      {channelCount} thread · {channelDescriptions[channel.label] ?? channel.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </Panel>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Chọn chuyên mục</h2>
                <p className="text-sm text-slate-500">Gọn thôi: lọc nhanh, theo dõi nhanh, rồi vào feed bên dưới.</p>
              </div>
              <button className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--erg-blue)] px-4 text-sm font-bold text-white transition hover:bg-slate-950" type="button">
                <PlusCircle className="h-4 w-4" />
                Tạo chủ đề
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              <CompactForumChip
                active={activeChannel === "all"}
                count={allThreadCount}
                description="Tất cả"
                followed={false}
                label="Tất cả"
                onFollow={undefined}
                onSelect={() => setActiveChannel("all")}
              />
              {forumTopicRows.slice(0, 6).map((board) => (
                <CompactForumChip
                  key={board.channel}
                  active={activeChannel === board.channel}
                  count={board.threads + posts.filter((post) => post.channel === board.channel).length}
                  description={board.group}
                  followed={followedChannels.includes(board.channel)}
                  label={board.channel}
                  onFollow={() => toggleChannelFollow(board.channel)}
                  onSelect={() => setActiveChannel(board.channel)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
              {forumTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold transition",
                      isActive ? "bg-[var(--erg-blue)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-0 border-b border-slate-100 text-sm md:grid-cols-3">
              <ForumDigestItem icon={Flame} label="Đang sôi nổi" value={getHotThread(posts)?.title ?? createThreadTitle(getHotThread(posts)?.content ?? "", "Chủ đề")} />
              <ForumDigestItem icon={Clock3} label="Chờ phản hồi" value={`${mentorThreadCount} thread cần mentor`} />
              <ForumDigestItem icon={Tags} label="Tag nổi bật" value={getTopTags(posts).join(", ")} />
            </div>
          </div>

          <form className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm" onSubmit={handleSubmit}>
            <div className="flex items-start gap-3 p-4">
              <Avatar author={viewerTeacher} size="lg" />
              <div className="min-w-0 flex-1">
                <input
                  className="mb-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                  placeholder="Tiêu đề chủ đề: ví dụ Cần mentor review phần warm-up Unit 8"
                  value={topicTitle}
                  onChange={(event) => setTopicTitle(event.target.value)}
                />
                <textarea
                  className="min-h-24 w-full resize-none rounded-2xl bg-slate-100 px-4 py-3 text-[15px] leading-7 outline-none transition placeholder:text-slate-500 focus:bg-slate-50 focus:ring-2 focus:ring-[var(--erg-blue)]/15"
                  placeholder="Thầy cô muốn chia sẻ bài giảng, hỏi mentor hay xin góp ý tiết dạy nào?"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <CommunityMediaGrid attachments={attachments} onRemove={(id) => setAttachments((current) => current.filter((item) => item.id !== id))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {communityChannels.slice(0, 3).map((channel) => (
                  <button
                    key={channel.label}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition",
                      selectedChannel === channel.label ? "bg-[var(--erg-blue)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                    type="button"
                    onClick={() => setSelectedChannel(channel.label)}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-200" htmlFor="teacher-community-image">
                  <ImagePlus className="h-4 w-4" />
                  Ảnh
                </label>
                <input id="teacher-community-image" className="sr-only" type="file" accept="image/*,video/*" multiple onChange={(event) => {
                  void handleAttachmentChange(event.target.files);
                  event.target.value = "";
                }} />
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--erg-blue)] px-5 text-sm font-bold text-white transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPosting || (!draft.trim() && attachments.length === 0)}
                  type="submit"
                >
                  <Send className="h-4 w-4" />
                  {isPosting ? "Đang đăng" : "Đăng"}
                </button>
              </div>
            </div>
          </form>

          {visiblePosts.length > 0 ? (
            <>
            {visiblePosts.map((post) => (
              <TeacherPostCard
                key={post.id}
                followedUsers={followedUsers}
                post={post}
                viewerAuthor={viewerTeacher}
                onAddComment={addComment}
                onCommentReaction={toggleCommentReaction}
                onFollowUser={toggleUserFollow}
                onPostReaction={togglePostReaction}
              />
            ))}
            {hasLockedFeed ? (
              <CommunityLoginGate
                hiddenCount={sortedPosts.length - visiblePosts.length}
                onLogin={() => setLoginGateOpen(true)}
              />
            ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">Chưa có thread phù hợp</h2>
              <p className="mt-2 text-sm text-slate-500">Đổi bộ lọc hoặc mở một chủ đề mới cho cộng đồng giáo viên.</p>
            </div>
          )}
        </main>

        <aside className="hidden space-y-4 xl:block">
          <Panel>
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Pin className="h-4 w-4 text-[var(--erg-red)]" />
              Chủ đề đang nóng
            </div>
            <div className="mt-4 space-y-3">
              {sortedPosts.slice(0, 4).map((post) => (
                <button key={post.id} className="block w-full rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100" type="button">
                  <span className="block text-xs font-bold text-[var(--erg-blue)]">{post.channel}</span>
                  <span className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{post.content}</span>
                  <span className="mt-2 block text-xs text-slate-500">{getCommentCount(post.comments)} bình luận</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Bookmark className="h-4 w-4 text-[var(--erg-blue)]" />
              Tài sản cộng đồng
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3">Lesson kit được mentor duyệt</div>
              <div className="rounded-xl bg-slate-50 p-3">Mẫu rubric chấm speaking</div>
              <div className="rounded-xl bg-slate-50 p-3">Case xử lý lớp đông</div>
            </div>
          </Panel>
        </aside>
      </div>
      <TeacherAuthDialog
        open={loginGateOpen}
        onOpenChange={setLoginGateOpen}
        onAuthenticated={() => {
          setLoginGateOpen(false);
          void communityHydrationQuery.refetch();
        }}
      />
    </div>
  );
}

function TeacherPostCard({
  followedUsers,
  post,
  viewerAuthor,
  onAddComment,
  onCommentReaction,
  onFollowUser,
  onPostReaction,
}: {
  followedUsers: string[];
  post: TeacherCommunityPost;
  viewerAuthor: TeacherCommunityAuthor;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: SocialReactionKey) => void;
  onFollowUser: (name: string) => void;
  onPostReaction: (postId: string, reaction: SocialReactionKey) => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const reactionTotal = getReactionTotal(post.reactions);
  const commentTotal = getCommentCount(post.comments);
  const isFollowingAuthor = followedUsers.includes(post.author.name);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddComment(post.id, undefined, commentDraft);
    setCommentDraft("");
  }

  return (
    <article className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 p-4">
        <Avatar author={post.author} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-950">{post.author.name}</span>
            {post.author.verified ? <span className="rounded-full bg-[var(--erg-blue)] px-1.5 py-0.5 text-[10px] font-black text-white">✓</span> : null}
            {post.pinned ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-[var(--erg-red)]">Ghim</span> : null}
            <button
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black transition",
                isFollowingAuthor ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
              type="button"
              onClick={() => onFollowUser(post.author.name)}
            >
              {isFollowingAuthor ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              {isFollowingAuthor ? "Đang theo dõi" : "Theo dõi"}
            </button>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <span>{post.author.role}</span>
            <span>·</span>
            <span>{post.createdAtLabel}</span>
            <span>·</span>
            <span>{post.channel}</span>
          </div>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" type="button">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      <div className="px-4 pb-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ForumStatusBadge status={getForumStatus(post)} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{getThreadTypeLabel(post)}</span>
          <span className="text-xs font-semibold text-slate-400">{post.views ?? estimateViews(post)} lượt xem</span>
        </div>
        <h2 className="mb-2 text-xl font-black leading-tight tracking-tight text-slate-950">{post.title ?? createThreadTitle(post.content, post.channel)}</h2>
        <p className="whitespace-pre-line text-[15px] leading-7 text-slate-800">{post.content}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {getPostTags(post).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
        {post.resourceTitle ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            <FileText className="h-4 w-4 text-[var(--erg-blue)]" />
            {post.resourceTitle}
          </div>
        ) : null}
        <CommunityMediaGrid attachments={post.attachments} readonly />
      </div>

      <div className="mx-4 flex items-center justify-between border-y border-slate-100 py-2 text-sm text-slate-500">
        <SocialReactionSummary reactions={post.reactions} total={reactionTotal} />
        <span>{commentTotal} bình luận · 18 chia sẻ</span>
      </div>

      <div className="mx-2 grid grid-cols-3 gap-1 p-2">
        <SocialReactionAction activeReaction={post.viewerReaction} onReaction={(reaction) => onPostReaction(post.id, reaction)} />
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100" type="button">
          <MessageCircle className="h-4 w-4" />
          Bình luận
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100" type="button">
          <Share2 className="h-4 w-4" />
          Chia sẻ
        </button>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <div className="space-y-3">
          {post.comments.map((comment) => (
            <TeacherCommentItem
              key={comment.id}
              comment={comment}
              depth={1}
              postId={post.id}
              viewerAuthor={viewerAuthor}
              onAddComment={onAddComment}
              onCommentReaction={onCommentReaction}
            />
          ))}
        </div>
        <form className="mt-3 flex items-center gap-2" onSubmit={submitComment}>
          <Avatar author={viewerAuthor} />
          <input
            className="h-10 min-w-0 flex-1 rounded-full bg-slate-100 px-4 text-sm outline-none transition placeholder:text-slate-500 focus:bg-slate-50 focus:ring-2 focus:ring-[var(--erg-blue)]/15"
            placeholder="Viết bình luận với vai trò giáo viên..."
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
          />
          <button className="grid h-10 w-10 place-items-center rounded-full bg-[var(--erg-blue)] text-white transition hover:bg-slate-950 disabled:opacity-40" disabled={!commentDraft.trim()} type="submit">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </article>
  );
}

function CommunityLoginGate({ hiddenCount, onLogin }: { hiddenCount: number; onLogin: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-white via-white/90 to-transparent blur-sm" />
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--erg-blue)]/10 text-[var(--erg-blue)]">
        <UserCheck className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">Đăng nhập để xem tiếp cộng đồng</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Bạn đang xem 4 tin hot nhất. Còn {hiddenCount} thread, bình luận, reaction và tài nguyên cộng đồng chỉ mở sau khi đăng nhập.
      </p>
      <button
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--erg-blue)] px-5 text-sm font-bold text-white transition hover:bg-slate-950"
        type="button"
        onClick={onLogin}
      >
        <UserPlus className="h-4 w-4" />
        Đăng nhập / đăng ký
      </button>
    </div>
  );
}

function TeacherCommentItem({
  comment,
  depth,
  postId,
  viewerAuthor,
  onAddComment,
  onCommentReaction,
}: {
  comment: TeacherCommunityComment;
  depth: number;
  postId: string;
  viewerAuthor: TeacherCommunityAuthor;
  onAddComment: (postId: string, parentCommentId: string | undefined, content: string) => void;
  onCommentReaction: (postId: string, commentId: string, reaction: SocialReactionKey) => void;
}) {
  const [replyDraft, setReplyDraft] = useState("");
  const [replying, setReplying] = useState(false);
  const reactionTotal = getReactionTotal(comment.reactions);
  const nextDepth = Math.min(depth + 1, 3);

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddComment(postId, comment.id, replyDraft);
    setReplyDraft("");
    setReplying(false);
  }

  return (
    <div className={cn("flex gap-2", depth > 1 && "border-l-2 border-slate-200 pl-3")}>
      <Avatar author={comment.author} />
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-[18px] bg-slate-100 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-950">{comment.author.name}</span>
            <span className="text-[11px] text-slate-500">{comment.author.role}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-line text-sm leading-6 text-slate-700">{comment.content}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 px-2 text-xs font-semibold text-slate-500">
          <span>{comment.createdAtLabel}</span>
          <SocialReactionAction compact activeReaction={comment.viewerReaction} onReaction={(reaction) => onCommentReaction(postId, comment.id, reaction)} />
          <button className="transition hover:text-[var(--erg-blue)]" type="button" onClick={() => setReplying((current) => !current)}>
            Trả lời
          </button>
          <SocialReactionCountBadge reactions={comment.reactions} total={reactionTotal} />
        </div>
        {replying ? (
          <form className="mt-2 flex items-center gap-2" onSubmit={submitReply}>
            <Avatar author={viewerAuthor} />
            <input
              className="h-9 min-w-0 flex-1 rounded-full bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--erg-blue)]/15"
              placeholder={`Trả lời ${comment.author.name}`}
              value={replyDraft}
              onChange={(event) => setReplyDraft(event.target.value)}
            />
            <button className="grid h-9 w-9 place-items-center rounded-full bg-[var(--erg-blue)] text-white disabled:opacity-40" disabled={!replyDraft.trim()} type="submit">
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : null}
        {comment.replies.length > 0 ? (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <TeacherCommentItem
                key={reply.id}
                comment={reply}
                depth={nextDepth}
                postId={postId}
                viewerAuthor={viewerAuthor}
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

function CommunityMediaGrid({
  attachments,
  onRemove,
  readonly,
}: {
  attachments: CommunityAttachment[];
  onRemove?: (attachmentId: string) => void;
  readonly?: boolean;
}) {
  if (attachments.length === 0) return null;

  const visibleAttachments = attachments.slice(0, attachments.length > 5 ? 5 : attachments.length);
  const hiddenCount = Math.max(0, attachments.length - visibleAttachments.length);
  const layout = getMediaLayoutClass(visibleAttachments.length);

  return (
    <div className={cn("mt-3 grid overflow-hidden rounded-xl border border-slate-200 bg-slate-200", layout.container)}>
      {visibleAttachments.map((attachment, index) => (
        <MediaTile
          key={attachment.id}
          attachment={attachment}
          className={layout.item(index)}
          hiddenCount={index === visibleAttachments.length - 1 ? hiddenCount : 0}
          readonly={readonly}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function MediaTile({
  attachment,
  className,
  hiddenCount,
  onRemove,
  readonly,
}: {
  attachment: CommunityAttachment;
  className?: string;
  hiddenCount?: number;
  onRemove?: (attachmentId: string) => void;
  readonly?: boolean;
}) {
  return (
    <div className={cn("group relative min-h-0 overflow-hidden bg-slate-100", className)}>
      {attachment.type === "video" ? (
        <video className="h-full w-full object-cover" controls muted preload="metadata" src={attachment.url} />
      ) : (
        <img className="h-full w-full object-cover" src={attachment.url} alt={attachment.name} />
      )}
      {attachment.type === "video" ? (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-white">
          <Video className="h-3.5 w-3.5" />
          Video
        </span>
      ) : null}
      {hiddenCount && hiddenCount > 0 ? (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-4xl font-black text-white">
          +{hiddenCount}
        </div>
      ) : null}
      {!readonly && onRemove ? (
        <button
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/70 text-white opacity-0 transition group-hover:opacity-100"
          type="button"
          onClick={() => onRemove(attachment.id)}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function getMediaLayoutClass(count: number): { container: string; item: (index: number) => string } {
  if (count <= 1) {
    return {
      container: "h-[420px] grid-cols-1",
      item: () => "h-full",
    };
  }

  if (count === 2) {
    return {
      container: "h-[420px] grid-cols-2 gap-0.5",
      item: () => "h-full",
    };
  }

  if (count === 3) {
    return {
      container: "h-[420px] grid-cols-2 grid-rows-2 gap-0.5",
      item: (index) => (index === 0 ? "row-span-2 h-full" : "h-full"),
    };
  }

  if (count === 4) {
    return {
      container: "h-[420px] grid-cols-2 grid-rows-2 gap-0.5",
      item: () => "h-full",
    };
  }

  return {
    container: "h-[460px] grid-cols-6 grid-rows-2 gap-0.5",
    item: (index) => (index < 2 ? "col-span-3 h-full" : "col-span-2 h-full"),
  };
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", className)}>{children}</section>;
}

function MiniForumStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
      <strong className="text-sm text-slate-950">{value}</strong>
      {label}
    </span>
  );
}

function ForumDigestItem({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-slate-100 px-4 py-3 md:border-r last:md:border-r-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--erg-blue)]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">{value || "Chưa có dữ liệu"}</span>
      </span>
    </div>
  );
}

function CompactForumChip({
  active,
  count,
  description,
  followed,
  label,
  onFollow,
  onSelect,
}: {
  active: boolean;
  count: number;
  description: string;
  followed: boolean;
  label: string;
  onFollow?: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[210px] items-center gap-2 rounded-2xl border px-3 py-2 transition",
        active ? "border-[var(--erg-blue)] bg-[var(--erg-blue)] text-white" : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
      )}
    >
      <button className="min-w-0 flex-1 text-left" type="button" onClick={onSelect}>
        <span className="block truncate text-sm font-black">{label}</span>
        <span className={cn("mt-0.5 block truncate text-xs", active ? "text-white/75" : "text-slate-500")}>
          {formatCompactNumber(count)} thread · {description}
        </span>
      </button>
      {onFollow ? (
        <button
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full transition",
            followed
              ? active
                ? "bg-white text-[var(--erg-blue)]"
                : "bg-emerald-50 text-emerald-700"
              : active
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-white text-slate-500 hover:text-[var(--erg-blue)]",
          )}
          type="button"
          title={followed ? "Bỏ theo dõi chuyên mục" : "Theo dõi chuyên mục"}
          onClick={onFollow}
        >
          {followed ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        </button>
      ) : null}
    </div>
  );
}

function ForumStatusBadge({ status }: { status: NonNullable<TeacherCommunityPost["status"]> }) {
  const statusMap = {
    answered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "mentor-needed": "border-amber-200 bg-amber-50 text-amber-700",
    open: "border-blue-200 bg-blue-50 text-blue-700",
    resource: "border-violet-200 bg-violet-50 text-violet-700",
  };
  const labelMap = {
    answered: "Đã giải quyết",
    "mentor-needed": "Cần mentor",
    open: "Đang thảo luận",
    resource: "Tài nguyên",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black", statusMap[status])}>
      {labelMap[status]}
    </span>
  );
}

function Avatar({ author, size = "default" }: { author: TeacherCommunityAuthor; size?: "default" | "lg" }) {
  const dimensionClass = size === "lg" ? "h-11 w-11" : "h-8 w-8";

  if (author.avatarUrl) {
    return (
      <img
        alt={author.name}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-slate-200", dimensionClass)}
        src={author.avatarUrl}
        title={author.name}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[var(--erg-blue)] text-xs font-black text-white",
        dimensionClass,
      )}
      title={author.name}
    >
      {author.initials}
    </span>
  );
}

function getForumStatus(post: TeacherCommunityPost): NonNullable<TeacherCommunityPost["status"]> {
  if (post.status) return post.status;
  if (post.resourceTitle || post.attachments.length >= 4) return "resource";
  if (post.pinned || post.channel.includes("Review")) return "mentor-needed";
  if (getCommentCount(post.comments) > 0) return "answered";
  return "open";
}

function getThreadTypeLabel(post: TeacherCommunityPost) {
  const type = post.threadType ?? inferThreadTypeFromChannel(post.channel);
  const labels: Record<NonNullable<TeacherCommunityPost["threadType"]>, string> = {
    case: "Case lớp học",
    question: "Hỏi đáp",
    review: "Review",
    share: "Chia sẻ",
    video: "Video",
  };
  return labels[type];
}

function getPostTags(post: TeacherCommunityPost) {
  return post.tags && post.tags.length > 0 ? post.tags : inferTagsFromChannel(post.channel);
}

function inferThreadTypeFromChannel(channel: string): NonNullable<TeacherCommunityPost["threadType"]> {
  if (channel.includes("Review")) return "review";
  if (channel.includes("Kho")) return "share";
  if (channel.includes("Video")) return "video";
  if (channel.includes("TÃ¬nh") || channel.includes("Tình")) return "case";
  return "question";
}

function inferTagsFromChannel(channel: string) {
  if (channel.includes("Review")) return ["lesson-flow", "mentor-review"];
  if (channel.includes("Kho")) return ["resource", "reuse"];
  if (channel.includes("Video")) return ["recording", "teaching-demo"];
  if (channel.includes("TÃ¬nh") || channel.includes("Tình")) return ["classroom-case", "behavior"];
  return ["community", "discussion"];
}

function createThreadTitle(content: string, fallback: string) {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (!normalized) return fallback;
  return normalized.length > 84 ? `${normalized.slice(0, 84)}...` : normalized;
}

function estimateViews(post: TeacherCommunityPost) {
  return Math.max(24, getReactionTotal(post.reactions) * 5 + getCommentCount(post.comments) * 12 + post.attachments.length * 8);
}

function getHotThread(posts: TeacherCommunityPost[]) {
  return getHotPosts(posts)[0];
}

function getHotPosts(posts: TeacherCommunityPost[]) {
  return [...posts].sort((left, right) => {
    const leftScore = getReactionTotal(left.reactions) + getCommentCount(left.comments) * 4 + Number(Boolean(left.pinned)) * 20;
    const rightScore = getReactionTotal(right.reactions) + getCommentCount(right.comments) * 4 + Number(Boolean(right.pinned)) * 20;
    return rightScore - leftScore;
  });
}

function getTopTags(posts: TeacherCommunityPost[]) {
  const tagCounts = new Map<string, number>();
  posts.forEach((post) => {
    getPostTags(post).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });

  return [...tagCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([tag]) => `#${tag}`);
}

function matchesCommunitySearch(post: TeacherCommunityPost, query: string) {
  const haystack = [
    post.title,
    post.content,
    post.channel,
    post.author.name,
    post.author.role,
    post.resourceTitle,
    ...getPostTags(post),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function normalizeForumBoards(topics: CommunityTopicDTO[]): ForumBoard[] {
  if (topics.length === 0) return forumBoards;

  return topics.map((topic) => ({
    channel: topic.name,
    description: topic.description ?? "Chủ đề cộng đồng",
    group: topic.groupName,
    latestLabel: topic.lastPostAt ? `Cập nhật ${formatRelativeTime(topic.lastPostAt)}` : "Chưa có bài mới",
    messages: topic.postCount,
    threads: topic.threadCount,
  }));
}

function communityPostToTeacherPost(post: CommunityPostDTO): TeacherCommunityPost {
  const createdAt = new Date(post.createdAt).getTime();
  return {
    id: post.id,
    author: {
      avatarUrl: post.author.avatarUrl,
      initials: getInitials(post.author.fullName),
      name: post.author.fullName,
      role: post.author.role ?? "Giáo viên ERG",
      verified: post.author.verified,
    },
    channel: post.topicName ?? "Bảng tin giáo viên",
    content: post.content,
    createdAtLabel: formatRelativeTime(post.createdAt),
    createdAtMs: Number.isFinite(createdAt) ? createdAt : Date.now(),
    attachments: post.media.map((item) => ({
      id: item.id ?? item.url,
      mimeType: item.mimeType,
      name: item.originalName ?? item.id ?? "media",
      storageKey: item.storageKey,
      type: item.type,
      url: item.url,
    })),
    comments: [],
    pinned: post.isPinned,
    status: post.status === "closed" ? "answered" : post.status,
    tags: post.tags,
    threadType: post.postType === "discussion" || post.postType === "resource" ? inferThreadTypeFromChannel(post.topicName ?? "") : post.postType,
    title: post.title,
    views: post.viewCount,
    viewerReaction: post.viewerReaction ?? null,
    reactions: reactionSummaryFromDTO(post.reactions),
  };
}

function reactionSummaryFromDTO(reactions: CommunityPostDTO["reactions"]) {
  return createReactionSummary({
    angry: reactions.angry,
    care: reactions.care,
    haha: reactions.haha,
    like: reactions.like,
    love: reactions.love,
    sad: reactions.sad,
    wow: reactions.wow,
  });
}

function topicIdForChannel(topics: CommunityTopicDTO[], channel: string) {
  return topics.find((topic) => topic.name === channel || topic.slug === topicSlugForChannel(channel))?.id;
}

function topicSlugForChannel(channel: string) {
  const known: Record<string, string> = {
    "Bảng tin giáo viên": "bang-tin-giao-vien",
    "Review bài giảng": "review-bai-giang",
    "Kho chia sẻ": "kho-chia-se",
    "Video tiết dạy": "video-tiet-day",
    "Tình huống lớp học": "tinh-huong-lop-hoc",
    "Đánh giá & kiểm tra": "danh-gia-kiem-tra",
  };
  return known[channel] ?? "";
}

function formatRelativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Vừa xong";
  const diffMs = Date.now() - time;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < minute) return "Vừa xong";
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))} phút`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ`;
  return `${Math.floor(diffMs / day)} ngày`;
}

function teacherAuthorFromAccount(account: TeacherAccount | null): TeacherCommunityAuthor {
  if (!account) return guestTeacher;

  return {
    avatarUrl: account.avatarUrl || undefined,
    initials: getInitials(account.fullName || account.email),
    name: account.fullName || account.email,
    role: account.title || account.department || "Giáo viên ERG",
    verified: account.provider === "google" || account.role === "admin" || account.role === "coordinator",
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GV";
  return parts.slice(-2).map((part) => part[0]?.toUpperCase()).join("");
}

function createReactionSummary(counts: Partial<Record<SocialReactionKey, number>> = {}): ReactionSummaryState {
  return socialReactionKeys.reduce<ReactionSummaryState>((summary, reaction) => {
    summary[reaction] = {
      count: counts[reaction] ?? 0,
      label: viSocialReactionLabels[reaction],
    };
    return summary;
  }, {} as ReactionSummaryState);
}

function toggleReactionSummary(
  reactions: ReactionSummaryState,
  currentReaction: SocialReactionKey | null,
  nextReaction: SocialReactionKey,
) {
  const next = createReactionSummary();

  socialReactionKeys.forEach((reaction) => {
    next[reaction] = { ...reactions[reaction] };
  });

  if (currentReaction === nextReaction) {
    next[nextReaction] = {
      ...next[nextReaction],
      count: Math.max(0, next[nextReaction].count - 1),
    };
    return next;
  }

  if (currentReaction) {
    next[currentReaction] = {
      ...next[currentReaction],
      count: Math.max(0, next[currentReaction].count - 1),
    };
  }

  next[nextReaction] = {
    ...next[nextReaction],
    count: next[nextReaction].count + 1,
  };

  return next;
}

function addCommentToPost(post: TeacherCommunityPost, parentCommentId: string | undefined, comment: TeacherCommunityComment) {
  if (!parentCommentId) {
    return { ...post, comments: [...post.comments, comment] };
  }

  return {
    ...post,
    comments: addReplyToComments(post.comments, parentCommentId, comment, 1),
  };
}

function addReplyToComments(
  comments: TeacherCommunityComment[],
  parentCommentId: string,
  reply: TeacherCommunityComment,
  depth: number,
): TeacherCommunityComment[] {
  return comments.map((comment) => {
    if (comment.id === parentCommentId) {
      return depth >= 3
        ? { ...comment, replies: [...comment.replies, reply] }
        : { ...comment, replies: [...comment.replies, reply] };
    }

    return {
      ...comment,
      replies: addReplyToComments(comment.replies, parentCommentId, reply, Math.min(depth + 1, 3)),
    };
  });
}

function updateComments(
  comments: TeacherCommunityComment[],
  commentId: string,
  updater: (comment: TeacherCommunityComment) => TeacherCommunityComment,
): TeacherCommunityComment[] {
  return comments.map((comment) =>
    comment.id === commentId
      ? updater(comment)
      : {
          ...comment,
          replies: updateComments(comment.replies, commentId, updater),
        },
  );
}

function findComment(comments: TeacherCommunityComment[], commentId: string): TeacherCommunityComment | null {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const reply = findComment(comment.replies, commentId);
    if (reply) return reply;
  }
  return null;
}

function getReactionTotal(reactions: ReactionSummaryState) {
  return Object.values(reactions).reduce((total, reaction) => total + reaction.count, 0);
}

function getCommentCount(comments: TeacherCommunityComment[]): number {
  return comments.reduce((total, comment) => total + 1 + getCommentCount(comment.replies), 0);
}

function createImageAttachments(
  files: FileList | null,
  uploadMedia: (file: File) => Promise<{ media: { id?: string; mimeType?: string; originalName?: string; storageKey?: string; type: "image" | "video"; url: string } }>,
) {
  const mediaFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));

  return Promise.all(
    mediaFiles.map(async (file, index) => {
      try {
        const uploaded = await uploadMedia(file);
        return {
          id: uploaded.media.id ?? `teacher-community-media-${Date.now()}-${index}-${file.name}`,
          mimeType: uploaded.media.mimeType ?? file.type,
          name: uploaded.media.originalName ?? file.name,
          storageKey: uploaded.media.storageKey,
          type: uploaded.media.type,
          url: uploaded.media.url,
        } satisfies CommunityAttachment;
      } catch {
        return readLocalAttachmentPreview(file, index);
      }
    }),
  );
}

function readLocalAttachmentPreview(file: File, index: number) {
  return new Promise<CommunityAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `teacher-community-media-${Date.now()}-${index}-${file.name}`,
        mimeType: file.type,
        name: file.name,
        type: file.type.startsWith("video/") ? "video" : "image",
        url: typeof reader.result === "string" ? reader.result : "",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

