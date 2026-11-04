import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  ErgButton,
  ErgConfirmDialog,
  ErgEmptyState,
  ErgErrorState,
  ErgMetricStrip,
  ErgPageHeader,
  ErgSelect,
  ErgSkeleton,
  ErgStatusChip,
  ErgTable,
  ErgTextField,
} from "@/components/erg-mui";

const TONES = ["success", "warning", "error", "info", "neutral"] as const;
const SELECT_OPTIONS = [
  { label: "Lựa chọn mẫu A", value: "a" },
  { label: "Lựa chọn mẫu B", value: "b" },
];

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography component="h2" sx={{ fontSize: 16, fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

/** Trang tham chiếu cho dev: toàn bộ dữ liệu bên dưới là mẫu thành phần, không phải dữ liệu thật. */
export default function AdminUiKitPage() {
  const [dialog, setDialog] = useState<"normal" | "destructive" | null>(null);
  const [selected, setSelected] = useState("a");
  const close = () => setDialog(null);

  return (
    <Box>
      <ErgPageHeader
        description="Trang tham chiếu cho lập trình viên. Mọi dữ liệu trên trang này là dữ liệu mẫu của thành phần, không phải dữ liệu thật."
        primaryAction={<ErgButton variant="contained">Hành động chính (mẫu)</ErgButton>}
        secondaryActions={[
          { label: "Hành động phụ 1 (mẫu)", onClick: () => undefined },
          { label: "Hành động phụ 2 (mẫu)", onClick: () => undefined },
        ]}
        title="UI Kit (mẫu thành phần)"
      />

      <Section title="ErgMetricStrip (số liệu mẫu)">
        <ErgMetricStrip
          items={[
            { label: "Chỉ số mẫu A", value: 1234, hint: "Giá trị mẫu" },
            { label: "Chỉ số mẫu B", value: "56%" },
            { label: "Chỉ số mẫu C (chưa có dữ liệu)", value: null },
          ]}
        />
      </Section>

      <Section title="ErgStatusChip (5 tông màu, có/không chấm)">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[true, false].map((dot) => (
            <Box key={String(dot)} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {TONES.map((tone) => (
                <ErgStatusChip dot={dot} key={tone} label={`${tone}${dot ? " + chấm" : ""}`} tone={tone} />
              ))}
            </Box>
          ))}
        </Box>
      </Section>

      <Section title="ErgButton">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <ErgButton variant="contained">Contained</ErgButton>
          <ErgButton variant="outlined">Outlined</ErgButton>
          <ErgButton variant="text">Text</ErgButton>
          <ErgButton color="error" variant="contained">Error</ErgButton>
          <ErgButton disabled variant="contained">Disabled</ErgButton>
          <ErgButton loading variant="contained">Loading</ErgButton>
        </Box>
      </Section>

      <Section title="ErgConfirmDialog">
        <Box sx={{ display: "flex", gap: 1 }}>
          <ErgButton onClick={() => setDialog("normal")} variant="outlined">Mở hộp thoại xác nhận</ErgButton>
          <ErgButton color="error" onClick={() => setDialog("destructive")} variant="outlined">Mở hộp thoại xoá</ErgButton>
        </Box>
        <ErgConfirmDialog
          confirmLabel="Xác nhận"
          description="Nội dung mẫu của hộp thoại xác nhận."
          onCancel={close}
          onConfirm={close}
          open={dialog === "normal"}
          title="Xác nhận (mẫu)"
        />
        <ErgConfirmDialog
          confirmLabel="Xoá"
          description="Nội dung mẫu của hộp thoại có tính phá huỷ. Không có dữ liệu nào bị xoá."
          destructive
          impact="Ảnh hưởng mẫu: 0 bản ghi"
          onCancel={close}
          onConfirm={close}
          open={dialog === "destructive"}
          title="Xoá (mẫu)"
        />
      </Section>

      <Section title="ErgTextField / ErgSelect">
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, maxWidth: 640 }}>
          <ErgTextField label="Ô nhập mẫu" placeholder="Nhập văn bản mẫu" />
          <ErgSelect label="Ô chọn mẫu" onChange={(event) => setSelected(event.target.value)} options={SELECT_OPTIONS} value={selected} />
        </Box>
      </Section>

      <Section title="ErgTable (dòng mẫu)">
        <ErgTable>
          <TableHead>
            <TableRow>
              <TableCell>Tên mẫu</TableCell>
              <TableCell>Trạng thái mẫu</TableCell>
              <TableCell align="right">Số mẫu</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ["Dòng mẫu 1", "success", 10],
              ["Dòng mẫu 2", "warning", 20],
              ["Dòng mẫu 3", "error", 30],
            ].map(([name, tone, count]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell><ErgStatusChip label={String(tone)} tone={tone as (typeof TONES)[number]} /></TableCell>
                <TableCell align="right">{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ErgTable>
      </Section>

      <Section title="ErgSkeleton / ErgEmptyState / ErgErrorState">
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box>
            <ErgSkeleton height={20} width="60%" />
            <ErgSkeleton height={20} width="40%" />
          </Box>
          <ErgEmptyState description="Trạng thái rỗng mẫu." title="Chưa có dữ liệu (mẫu)" />
          <ErgErrorState
            action={<ErgButton variant="outlined">Thử lại (mẫu)</ErgButton>}
            description="Trạng thái lỗi mẫu, không có lỗi thật."
            title="Không tải được (mẫu)"
          />
        </Box>
      </Section>
    </Box>
  );
}
