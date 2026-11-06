import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, type ReactNode } from "react";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import {
  useCompetencies,
  useLearnerOutcomeQueries,
  useLearningOutcomeScope,
  useLearningPaths,
} from "@/features/lms/learning-paths/api/learning-outcomes-query";
import {
  CertificateTable,
  CompletionTable,
  LearningPathTable,
  OutcomeEmptyState,
  OutcomeLoadingState,
  OutcomeConfirmedBadge,
} from "@/features/lms/learning-paths/components/learning-outcomes-presentation";

export function StudentLearningOutcomesWorkspace() {
  const scope = useLearningOutcomeScope("STUDENT");
  const learnerId = getCurrentStudentSession()?.id?.trim() || "";
  const pathsQuery = useLearningPaths(scope, { status: "PUBLISHED" });
  const competenciesQuery = useCompetencies(scope);
  const learnerQueries = useLearnerOutcomeQueries(scope, learnerId);
  const pathTitleById = useMemo(() => new Map((pathsQuery.data ?? []).map((path) => [path.id, path.title])), [pathsQuery.data]);
  const completionCount = learnerQueries.completions.data?.filter((value) => value.status === "COMPLETED").length ?? 0;
  const certificateCount = learnerQueries.certificates.data?.filter((value) => value.status === "ISSUED").length ?? 0;

  if (!learnerId) return <Box sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 2, md: 3 } }}><OutcomeEmptyState description="Không xác định được tài khoản học viên. Vui lòng đăng nhập lại để xem chuẩn đầu ra." title="Chưa xác định được người học" /></Box>;

  return <Box sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 2, md: 3 } }}><Box sx={{ mb: 2.5 }}><Typography sx={{ fontWeight: 600, mt: 0.35 }} variant="h4">Hồ sơ chuẩn đầu ra</Typography><Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }} variant="body2">Theo dõi lộ trình, năng lực đã đạt và chứng chỉ của bạn. Dữ liệu chỉ hiển thị sau khi hệ thống xác nhận đúng tài khoản của bạn.</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}><MetricCard label="Lộ trình hoàn thành" value={String(completionCount)} /><MetricCard label="Chứng chỉ hợp lệ" value={String(certificateCount)} /><Box sx={{ alignItems: "center", display: "flex", ml: { sm: "auto" } }}><OutcomeConfirmedBadge /></Box></Stack><Stack spacing={2}><Surface title="Lộ trình đang mở">{pathsQuery.isLoading ? <OutcomeLoadingState /> : pathsQuery.error ? <QueryError onRetry={() => void pathsQuery.refetch()} /> : pathsQuery.data?.length ? <LearningPathTable paths={pathsQuery.data} /> : <OutcomeEmptyState description="Đơn vị chưa phát hành lộ trình cho phạm vi của bạn." title="Chưa có lộ trình" />}</Surface><Surface title="Tiến độ của tôi">{learnerQueries.completions.isLoading ? <OutcomeLoadingState /> : learnerQueries.completions.error ? <QueryError onRetry={() => void learnerQueries.completions.refetch()} /> : learnerQueries.completions.data?.length ? <CompletionTable completions={learnerQueries.completions.data} pathTitleById={pathTitleById} /> : <OutcomeEmptyState description="Khi bạn bắt đầu lộ trình, tiến độ sẽ xuất hiện ở đây." title="Chưa có tiến độ" />}</Surface><Surface title="Năng lực đã ghi nhận">{learnerQueries.attainments.isLoading ? <OutcomeLoadingState /> : learnerQueries.attainments.error ? <QueryError onRetry={() => void learnerQueries.attainments.refetch()} /> : learnerQueries.attainments.data?.length ? <AttainmentSummary competencies={competenciesQuery.data ?? []} attainments={learnerQueries.attainments.data} /> : <OutcomeEmptyState description="Chưa có bản ghi năng lực được giáo viên xác nhận." title="Chưa có năng lực" />}</Surface><Surface title="Chứng chỉ">{learnerQueries.certificates.isLoading ? <OutcomeLoadingState /> : learnerQueries.certificates.error ? <QueryError onRetry={() => void learnerQueries.certificates.refetch()} /> : learnerQueries.certificates.data?.length ? <CertificateTable certificates={learnerQueries.certificates.data} pathTitleById={pathTitleById} /> : <OutcomeEmptyState description="Chứng chỉ sẽ xuất hiện sau khi lộ trình được hoàn thành và đơn vị cấp." title="Chưa có chứng chỉ" />}</Surface></Stack></Box>;
}

function Surface({ children, title }: { children: ReactNode; title: string }) {
  return <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: { xs: 1.5, md: 2 } }}><Typography sx={{ fontWeight: 600, mb: 1.5 }} variant="h6">{title}</Typography>{children}</Box>;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <Card sx={{ border: "1px solid", borderColor: "divider", minWidth: 180 }}><CardContent sx={{ alignItems: "center", display: "flex", gap: 1.25, p: "14px !important" }}><WorkspacePremiumRoundedIcon color="primary" /><Box><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ fontSize: 22, fontWeight: 600 }}>{value}</Typography></Box></CardContent></Card>;
}

function AttainmentSummary({ attainments, competencies }: { attainments: Array<{ competencyId: string; status: string; progressPercent: number; evidenceRef: string }>; competencies: Array<{ id: string; code: string; name: string }> }) {
  const names = new Map(competencies.map((competency) => [competency.id, `${competency.code} · ${competency.name}`]));
  return <Stack spacing={1}>{attainments.map((attainment) => <Box key={`${attainment.competencyId}-${attainment.evidenceRef}`} sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 2, display: "flex", justifyContent: "space-between", p: 1.25 }}><Box><Typography sx={{ fontWeight: 600 }}>{names.get(attainment.competencyId) ?? attainment.competencyId}</Typography><Typography color="text.secondary" variant="caption">Bằng chứng: {attainment.evidenceRef}</Typography></Box><Typography sx={{ fontWeight: 600 }}>{attainment.progressPercent}% · {ATTAINMENT_STATUS[attainment.status] ?? "Đang cập nhật"}</Typography></Box>)}</Stack>;
}

const ATTAINMENT_STATUS: Record<string, string> = { ATTAINED: "Đã đạt", IN_PROGRESS: "Đang học", NOT_STARTED: "Chưa bắt đầu", NOT_ATTAINED: "Chưa đạt" };

function QueryError({ onRetry }: { onRetry: () => void }) {
  return <Alert severity="error" action={<Button color="inherit" size="small" variant="text" onClick={onRetry} sx={{ minHeight: 44 }}>Thử lại</Button>}>Không tải được dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.</Alert>;
}
