import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { GoogleSheetTab as SheetTab } from "@/features/lcms/imports/google-sheets-csv-adapter";
import { ImportField } from "@/features/lcms/admin-operations/components/student-sheet-import/import-primitives";

export function SheetRangeCard({
  loadSheet,
  rangeEnd,
  rangeStart,
  selectedSheetLabel,
  selectedSheetName,
  setRangeEnd,
  setRangeStart,
  setSelectedSheetName,
  sheetTabs,
  sheetUrl,
}: {
  loadSheet: (url: string, sheetName?: string) => Promise<void>;
  rangeEnd: string;
  rangeStart: string;
  selectedSheetLabel: string;
  selectedSheetName: string;
  setRangeEnd: (value: string) => void;
  setRangeStart: (value: string) => void;
  setSelectedSheetName: (value: string) => void;
  sheetTabs: SheetTab[];
  sheetUrl: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
        <Box>
          <Typography sx={{ color: "text.primary", fontSize: 14, fontWeight: 600 }}>Khoảng dữ liệu</Typography>
          <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>Chọn tab và vùng ô cần đọc.</Typography>
        </Box>
        <Chip size="small" variant="outlined" label={selectedSheetLabel} />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(200px, 1.5fr) repeat(2, minmax(0, 1fr))" }, gap: 1.5, mt: 2 }}>
        <ImportField label="Tab Sheet cần đọc">
          <TextField select fullWidth size="small"
            value={selectedSheetName}
            onChange={(event) => {
              const nextSheetName = event.target.value;
              setSelectedSheetName(nextSheetName);
              void loadSheet(sheetUrl, nextSheetName);
            }}
          >
            <MenuItem value="">Chọn theo mặc định (Tab đầu)</MenuItem>
            {sheetTabs.map((tab) => (
              <MenuItem key={tab.name} value={tab.name}>
                {tab.name}
              </MenuItem>
            ))}
          </TextField>
        </ImportField>
        <ImportField label="Tọa độ bắt đầu"><TextField size="small" fullWidth value={rangeStart} onChange={(event) => setRangeStart(event.target.value.toUpperCase())} placeholder="A1" sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
        <ImportField label="Tọa độ kết thúc"><TextField size="small" fullWidth value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value.toUpperCase())} placeholder="Z100" sx={{ "& input": { textTransform: "uppercase" } }} /></ImportField>
      </Box>

      {sheetTabs.length > 0 && (
        <Box sx={{ pt: 2 }}>
          <Typography sx={{ mb: 1, color: "text.secondary", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>Chuyển đổi nhanh các tab lớp</Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {sheetTabs.slice(0, 10).map((tab) => (
              <Button
                key={tab.name}
                type="button"
                variant={selectedSheetName === tab.name ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedSheetName(tab.name);
                  void loadSheet(sheetUrl, tab.name);
                }}
                sx={{ minHeight: 30, borderRadius: 1, px: 1.5, py: 0.75, fontSize: 12, fontWeight: 600, textTransform: "none" }}
              >
                {tab.name}
              </Button>
            ))}
            {sheetTabs.length > 10 && (
              <Chip variant="outlined" size="small" label={
                <>
                +{sheetTabs.length - 10} tab khác
                </>
              } sx={{ fontSize: 12, fontWeight: 600 }} />
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
