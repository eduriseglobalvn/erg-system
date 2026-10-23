import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type ReactNode } from "react";
import { CertificateRegistryWorkspace } from "@/features/lcms/certificates";
import {
  useAddPathNode,
  useCompetencies,
  useCreateCompetency,
  useCreateLearningPath,
  useLearningOutcomeScope,
  useLearningPath,
  useLearningPaths,
  usePublishLearningPath,
} from "@/features/lms/learning-paths/api/learning-outcomes-query";
import { newIdempotencyKey } from "@/features/lms/learning-paths/components/learning-outcomes-admin-dialogs";
import {
  AddPathNodeDialog,
  CreateCompetencyDialog,
  CreateLearningPathDialog,
} from "@/features/lms/learning-paths/components/learning-outcomes-admin-dialogs";
import {
  CompetencyTable,
  LearningPathTable,
  OutcomeConfirmedBadge,
  OutcomeEmptyState,
  OutcomeErrorState,
  OutcomeLoadingState,
} from "@/features/lms/learning-paths/components/learning-outcomes-presentation";

export function LearningOutcomesAdminWorkspace() {
  const scope = useLearningOutcomeScope("ADMIN");
  const [tab, setTab] = useState(0);
  const [selectedPathId, setSelectedPathId] = useState<string>();
  const [createPathOpen, setCreatePathOpen] = useState(false);
  const [createCompetencyOpen, setCreateCompetencyOpen] = useState(false);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const pathsQuery = useLearningPaths(scope, { status: "" });
  const competenciesQuery = useCompetencies(scope);
  const detailQuery = useLearningPath(scope, selectedPathId);
  const createPathMutation = useCreateLearningPath(scope);
  const publishMutation = usePublishLearningPath(scope);
  const addNodeMutation = useAddPathNode(scope);
  const createCompetencyMutation = useCreateCompetency(scope);
  const pathTitleById = useMemo(() => new Map((pathsQuery.data ?? []).map((path) => [path.id, path.title])), [pathsQuery.data]);

  async function createPath(input: Parameters<typeof createPathMutation.mutateAsync>[0]["input"]) {
    const created = await createPathMutation.mutateAsync({ input, idempotencyKey: newIdempotencyKey("learning-path") });
    setSelectedPathId(created.id);
    setCreatePathOpen(false);
  }

  async function createCompetency(input: Parameters<typeof createCompetencyMutation.mutateAsync>[0]["input"]) {
    await createCompetencyMutation.mutateAsync({ input, idempotencyKey: newIdempotencyKey("competency") });
    setCreateCompetencyOpen(false);
  }

  async function publishPath() {
    if (!detailQuery.data) return;
    await publishMutation.mutateAsync({ pathId: detailQuery.data.path.id, input: { expectedVersion: detailQuery.data.path.recordVersion }, idempotencyKey: newIdempotencyKey(`publish-${detailQuery.data.path.id}`) });
  }

  async function addNode(input: Parameters<typeof addNodeMutation.mutateAsync>[0]["input"]) {
    if (!selectedPathId) return;
    await addNodeMutation.mutateAsync({ pathId: selectedPathId, input, idempotencyKey: newIdempotencyKey(`path-node-${selectedPathId}`) });
    setAddNodeOpen(false);
  }

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 2, md: 3 } }}>
      <Box sx={{ alignItems: { xs: "flex-start", md: "center" }, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, justifyContent: "space-between", mb: 2.5 }}>
        <Box><Typography color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }} variant="caption">Admin · Learning Outcomes</Typography><Typography sx={{ fontWeight: 900, mt: 0.35 }} variant="h4">Chuẩn đầu ra & chứng nhận</Typography><Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }} variant="body2">Quản trị lộ trình học tập, năng lực và chứng chỉ theo phạm vi tenant. Mọi trạng thái hiển thị đều là dữ liệu đã được máy chủ xác nhận.</Typography></Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}><Chip icon={<AutoAwesomeRoundedIcon />} label="Learning outcomes" size="small" variant="outlined" /><Button onClick={() => setCreatePathOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Tạo lộ trình</Button></Stack>
      </Box>
      <Tabs onChange={(_, value) => setTab(value)} sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }} value={tab} variant="scrollable"><Tab label="Lộ trình học tập" /><Tab label={`Năng lực (${competenciesQuery.data?.length ?? 0})`} /><Tab label="Chứng chỉ" /></Tabs>
      {tab === 0 ? <LearningPathsPanel detailQuery={detailQuery} onAddNode={() => setAddNodeOpen(true)} onCreate={() => setCreatePathOpen(true)} onPublish={publishPath} onSelect={setSelectedPathId} pathsQuery={pathsQuery} publishPending={publishMutation.isPending} /> : null}
      {tab === 1 ? <CompetenciesPanel competenciesQuery={competenciesQuery} onCreate={() => setCreateCompetencyOpen(true)} /> : null}
      {tab === 2 ? <CertificateRegistryWorkspace pathTitleById={pathTitleById} scope={scope} /> : null}
      <CreateLearningPathDialog error={createPathMutation.error} onClose={() => setCreatePathOpen(false)} onSubmit={createPath} open={createPathOpen} pending={createPathMutation.isPending} />
      <CreateCompetencyDialog error={createCompetencyMutation.error} onClose={() => setCreateCompetencyOpen(false)} onSubmit={createCompetency} open={createCompetencyOpen} pending={createCompetencyMutation.isPending} />
      <AddPathNodeDialog error={addNodeMutation.error} expectedPathVersion={detailQuery.data?.path.recordVersion ?? 0} onClose={() => setAddNodeOpen(false)} onSubmit={addNode} open={addNodeOpen} pending={addNodeMutation.isPending} />
    </Box>
  );
}

function LearningPathsPanel({ detailQuery, onAddNode, onCreate, onPublish, onSelect, pathsQuery, publishPending }: { detailQuery: ReturnType<typeof useLearningPath>; onAddNode: () => void; onCreate: () => void; onPublish: () => void; onSelect: (id: string) => void; pathsQuery: ReturnType<typeof useLearningPaths>; publishPending: boolean }) {
  return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { lg: "minmax(0, 1.45fr) minmax(320px, .8fr)" } }}><Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><SectionHeading action={<Button onClick={onCreate} size="small" startIcon={<AddRoundedIcon />}>Thêm</Button>} title="Lộ trình đã cấu hình" />{pathsQuery.isLoading ? <OutcomeLoadingState /> : pathsQuery.error ? <OutcomeErrorState message={pathsQuery.error instanceof Error ? pathsQuery.error.message : undefined} /> : pathsQuery.data?.length ? <LearningPathTable onSelect={onSelect} paths={pathsQuery.data} selectedId={detailQuery.data?.path.id} /> : <OutcomeEmptyState description="Tạo lộ trình đầu tiên để liên kết nội dung và tiêu chí hoàn thành." title="Chưa có lộ trình" />}</Box><PathDetailCard detailQuery={detailQuery} onAddNode={onAddNode} onPublish={onPublish} publishPending={publishPending} /></Box>;
}

function PathDetailCard({ detailQuery, onAddNode, onPublish, publishPending }: { detailQuery: ReturnType<typeof useLearningPath>; onAddNode: () => void; onPublish: () => void; publishPending: boolean }) {
  if (!detailQuery.data && !detailQuery.isLoading) return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}><OutcomeEmptyState description="Chọn một lộ trình để xem nội dung, phiên bản và thao tác phát hành." title="Chưa chọn lộ trình" /></Box>;
  if (detailQuery.isLoading) return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}><OutcomeLoadingState /></Box>;
  if (detailQuery.error || !detailQuery.data) return <OutcomeErrorState message={detailQuery.error instanceof Error ? detailQuery.error.message : undefined} />;
  const { path, nodes } = detailQuery.data;
  return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 2, md: 2.5 } }}><SectionHeading action={path.status === "DRAFT" ? <Button disabled={publishPending} onClick={onPublish} size="small" startIcon={<PublishRoundedIcon />} variant="contained">Phát hành</Button> : <OutcomeConfirmedBadge />} title={path.title} /><Typography color="text.secondary" variant="body2">Phiên bản {path.recordVersion} · {path.nodeCount} nút · {path.classId || path.educationUnitId || "Toàn đơn vị"}</Typography><Divider sx={{ my: 2 }} /><Stack spacing={1}>{nodes.length ? nodes.map((node) => <Box key={node.id} sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", gap: 1.25, justifyContent: "space-between", p: 1.25 }}><Box><Typography sx={{ fontWeight: 700 }}>{node.contentKind}</Typography><Typography color="text.secondary" variant="caption">{node.contentRefId}</Typography></Box><Chip label={node.required ? "Bắt buộc" : "Tùy chọn"} size="small" variant="outlined" /></Box>) : <OutcomeEmptyState description="Thêm nội dung từ thư viện để hoàn thiện lộ trình." title="Chưa có nút nội dung" />}</Stack>{path.status === "DRAFT" ? <Button onClick={onAddNode} sx={{ mt: 2 }} variant="outlined">Thêm nút nội dung</Button> : null}</Box>;
}

function CompetenciesPanel({ competenciesQuery, onCreate }: { competenciesQuery: ReturnType<typeof useCompetencies>; onCreate: () => void }) {
  return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><SectionHeading action={<Button onClick={onCreate} size="small" startIcon={<AddRoundedIcon />}>Thêm năng lực</Button>} title="Danh mục năng lực" />{competenciesQuery.isLoading ? <OutcomeLoadingState /> : competenciesQuery.error ? <OutcomeErrorState message={competenciesQuery.error instanceof Error ? competenciesQuery.error.message : undefined} /> : competenciesQuery.data?.length ? <CompetencyTable competencies={competenciesQuery.data} /> : <OutcomeEmptyState description="Năng lực là tiêu chí nền tảng cho đánh giá và cấp chứng nhận." title="Chưa có năng lực" />}</Box>;
}

function SectionHeading({ action, title }: { action?: ReactNode; title: string }) {
  return <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", mb: 1.5 }}><Typography sx={{ fontWeight: 850 }} variant="h6">{title}</Typography>{action}</Box>;
}
