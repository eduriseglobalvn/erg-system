import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import {
  useCompetencies,
  useLearnerOutcomeQueries,
  useLearningOutcomeScope,
  useLearningPaths,
  useRecordAttainment,
} from "@/features/lms/learning-paths/api/learning-outcomes-query";
import { newIdempotencyKey } from "@/features/lms/learning-paths/components/learning-outcomes-admin-dialogs";
import {
  CompetencyTable,
  CompletionTable,
  LearningPathTable,
  OutcomeEmptyState,
  OutcomeErrorState,
  OutcomeLoadingState,
} from "@/features/lms/learning-paths/components/learning-outcomes-presentation";

export function LearningOutcomesTeacherWorkspace() {
  const scope = useLearningOutcomeScope("TEACHER");
  const auth = useAuthSession("lms");
  const canManage = evaluatePermission({ permission: "learning.outcomes.manage", grantedPermissions: auth.session?.permissions, deniedPermissions: auth.session?.deniedPermissions });
  const [learnerInput, setLearnerInput] = useState("");
  const [learnerId, setLearnerId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const pathsQuery = useLearningPaths(scope, { status: "PUBLISHED" });
  const competenciesQuery = useCompetencies(scope);
  const learnerQueries = useLearnerOutcomeQueries(scope, learnerId);
  const attainmentMutation = useRecordAttainment(scope);

  async function recordAttainment() {
    if (!learnerId || !competencyId || !evidenceRef.trim()) return;
    await attainmentMutation.mutateAsync({ input: { learnerId, competencyId, evidenceRef: evidenceRef.trim(), progressPercent: 100 }, idempotencyKey: newIdempotencyKey(`attainment-${learnerId}-${competencyId}`) });
    setEvidenceRef("");
  }

  return <Box sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 2, md: 3 } }}><Box sx={{ mb: 2.5 }}><Typography color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }} variant="caption">Teacher · Learning Outcomes</Typography><Typography sx={{ fontWeight: 900, mt: 0.35 }} variant="h4">Theo dõi chuẩn đầu ra</Typography><Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }} variant="body2">Xem các lộ trình đã phát hành và tiến độ theo learner ID. Ghi nhận năng lực chỉ khả dụng khi phiên đăng nhập có capability quản lý tương ứng.</Typography></Box><Stack spacing={2}><Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><Typography sx={{ fontWeight: 850, mb: 1.5 }} variant="h6">Lộ trình đã phát hành</Typography>{pathsQuery.isLoading ? <OutcomeLoadingState /> : pathsQuery.error ? <OutcomeErrorState message={pathsQuery.error instanceof Error ? pathsQuery.error.message : undefined} /> : pathsQuery.data?.length ? <LearningPathTable paths={pathsQuery.data} /> : <OutcomeEmptyState description="Admin chưa phát hành lộ trình nào cho phạm vi hiện tại." title="Chưa có lộ trình" />}</Box><Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><Typography sx={{ fontWeight: 850, mb: 1.5 }} variant="h6">Danh mục năng lực</Typography>{competenciesQuery.isLoading ? <OutcomeLoadingState /> : competenciesQuery.error ? <OutcomeErrorState message={competenciesQuery.error instanceof Error ? competenciesQuery.error.message : undefined} /> : competenciesQuery.data?.length ? <CompetencyTable competencies={competenciesQuery.data} /> : <OutcomeEmptyState description="Chưa có năng lực được cấu hình." title="Danh mục trống" />}</Box><Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><Typography sx={{ fontWeight: 850, mb: 1.5 }} variant="h6">Tra cứu tiến độ người học</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 1.5 }}><TextField fullWidth label="Learner ID" onChange={(event) => setLearnerInput(event.target.value)} value={learnerInput} /><Button disabled={!learnerInput.trim()} onClick={() => setLearnerId(learnerInput.trim())} variant="contained">Tải tiến độ</Button></Stack>{!learnerId ? <OutcomeEmptyState description="Nhập learner ID để tải tiến độ, thành tích và chứng chỉ đúng phạm vi." title="Chưa chọn người học" /> : learnerQueries.completions.isLoading ? <OutcomeLoadingState /> : learnerQueries.completions.error ? <OutcomeErrorState message={learnerQueries.completions.error instanceof Error ? learnerQueries.completions.error.message : undefined} /> : learnerQueries.completions.data?.length ? <CompletionTable completions={learnerQueries.completions.data} /> : <OutcomeEmptyState description="Chưa có bản ghi hoàn thành cho learner này." title="Chưa có tiến độ" />}{learnerId && canManage ? <><Divider sx={{ my: 2 }} /><Chip label="Capability: learning.outcomes.manage" size="small" sx={{ mb: 1.25 }} variant="outlined" /><Stack direction={{ xs: "column", md: "row" }} spacing={1}><TextField fullWidth label="Competency ID" onChange={(event) => setCompetencyId(event.target.value)} value={competencyId} /><TextField fullWidth label="Evidence reference" onChange={(event) => setEvidenceRef(event.target.value)} value={evidenceRef} /><Button disabled={attainmentMutation.isPending || !competencyId.trim() || !evidenceRef.trim()} onClick={() => void recordAttainment()} variant="outlined">{attainmentMutation.isPending ? "Đang ghi…" : "Ghi nhận đạt"}</Button></Stack>{attainmentMutation.error ? <OutcomeErrorState message={attainmentMutation.error instanceof Error ? attainmentMutation.error.message : undefined} /> : null}</> : null}</Box></Stack></Box>;
}
