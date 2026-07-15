import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";

const statusLabel = { active: "Đang vận hành", onboarding: "Đang triển khai", paused: "Tạm dừng" } as const;
const statusColor = { active: "success", onboarding: "warning", paused: "default" } as const;

export function SchoolListPanel({ onAdd, onSelect, schools, selectedId }: {
  onAdd: () => void;
  onSelect: (id: string) => void;
  schools: PartnerSchool[];
  selectedId: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => schools.filter((school) => `${school.name} ${school.id} ${school.district}`.toLowerCase().includes(search.toLowerCase())), [schools, search]);

  return (
    <Box sx={{ bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", minHeight: 0, width: { xs: "100%", lg: 320 } }}>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: 2 }}>
        <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 850 }} variant="subtitle1">Trường liên kết</Typography>
            <Typography color="text.secondary" variant="caption">{schools.length} trường trong hệ thống</Typography>
          </Box>
          <Button aria-label="Thêm trường" onClick={onAdd} size="small" sx={{ minWidth: 36, px: 1 }} variant="contained"><AddRoundedIcon fontSize="small" /></Button>
        </Box>
        <TextField
          fullWidth placeholder="Tìm trường, ID trường..." size="small" value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 19 }} /></InputAdornment> } }}
        />
      </Box>
      <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}>
        {filtered.map((school) => (
          <ListItemButton key={school.id} onClick={() => onSelect(school.id)} selected={school.id === selectedId} sx={{ alignItems: "flex-start", borderLeft: "3px solid transparent", mx: 1, my: 0.5, borderRadius: 2, px: 1.5, py: 1.35, "&.Mui-selected": { bgcolor: "primary.50", borderLeftColor: "primary.main" } }}>
            <Box sx={{ minWidth: 0, width: "100%" }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 800 }}>{school.name}</Typography>
              <Typography color="text.secondary" noWrap sx={{ fontFamily: "var(--font-mono)", fontSize: 12.5, mt: 0.25 }}>{school.id} · {school.district}</Typography>
              <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", mt: 1 }}>
                <Chip color={statusColor[school.status]} label={statusLabel[school.status]} size="small" sx={{ height: 22, fontSize: 11 }} />
                <Typography color="text.secondary" variant="caption">{school.students.length} HS</Typography>
              </Box>
            </Box>
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
