import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function SheetUrlCard({
  isLoading,
  loadSheet,
  setSheetUrl,
  sheetUrl,
}: {
  isLoading: boolean;
  loadSheet: (url: string, sheetName?: string) => Promise<void>;
  setSheetUrl: (value: string) => void;
  sheetUrl: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 2, boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)" }}>
      <Box component="label" sx={{ display: "block" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
          <TableViewOutlinedIcon sx={{ color: "success.main", fontSize: 18 }} /> Đường dẫn Google Sheet
        </Stack>
        <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 12 }}>Sheet cần bật quyền xem bằng liên kết.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            value={sheetUrl}
            onChange={(event) => setSheetUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void loadSheet(sheetUrl);
              }
            }}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => void loadSheet(sheetUrl)}
            disabled={isLoading}
            sx={{ minHeight: 40, flexShrink: 0, borderRadius: 1.25, px: 2.5, fontSize: 12, fontWeight: 700, textTransform: "none" }}
          >
            {isLoading ? "Đang xử lý..." : "Đồng bộ dữ liệu"}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
