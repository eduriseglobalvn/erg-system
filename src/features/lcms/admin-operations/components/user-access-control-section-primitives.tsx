import type { ReactNode } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { actionSx } from "./user-access-control-section-config";

export function SaveButton({ children, saving, onClick }: { children: ReactNode; saving: boolean; onClick: () => void }) { return <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />} disabled={saving} onClick={onClick} sx={actionSx}>{children}</Button>; }
export function PickerSurface({ title, caption, children }: { title: string; caption: string; children: ReactNode }) { return <Paper variant="outlined" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "120px minmax(0, 1fr)" }, gap: 1.5, borderRadius: 1.5, bgcolor: "action.hover", p: 2 }}><Box><Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{title}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10 }}>{caption}</Typography></Box><Box sx={{ minWidth: 0 }}>{children}</Box></Paper>; }
export function MetricChip({ label }: { label: string }) { return <Chip label={label} size="small" variant="outlined" sx={{ bgcolor: "action.hover", fontSize: 10, fontWeight: 700 }} />; }

export function HeaderMetric({ label, value }: { label: string; value: string }) { return <Box sx={{ minWidth: 100, px: 1.75, py: 1.5 }}><Typography sx={{ color: "text.primary", fontSize: 16, fontWeight: 700 }}>{value}</Typography><Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{label}</Typography></Box>; }
export function Banner({ children, tone }: { children: ReactNode; tone: "error" | "success" }) { const error = tone === "error"; return <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", mt: 2, border: 1, borderColor: error ? "error.light" : "success.light", borderRadius: 1.5, bgcolor: error ? "error.50" : "success.50", color: error ? "error.dark" : "success.dark", px: 2, py: 1.5, fontSize: 12, fontWeight: 600 }}>{error ? <ErrorOutlineIcon sx={{ mt: 0.25, fontSize: 18 }} /> : <CheckIcon sx={{ mt: 0.25, fontSize: 18 }} />}<Box>{children}</Box></Stack>; }
export function LoadingBlock({ label }: { label: string }) { return <Paper variant="outlined" aria-label={label} sx={{ display: "grid", gap: 1.5, borderRadius: 1.5, p: 2.5 }}><Skeleton width={176} height={16} /><Skeleton width="100%" height={12} /><Skeleton width="66%" height={12} /></Paper>; }
export function EmptyBlock({ label }: { label: string }) { return <Box sx={{ border: 1, borderStyle: "dashed", borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover", p: 3, color: "text.secondary", fontSize: 12, fontWeight: 600, lineHeight: 1.6, textAlign: "center" }}>{label}</Box>; }

