import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { ClassLogChange } from "../api/class-log-api";
import { changeText, changeTimeText } from "../domain/class-log-copy";
import { shortDateVi, weekdayVi } from "../domain/class-log-week";
import { bodyCellSx, headCellSx } from "./class-log-ui";

/** «Nhật ký sổ»: who changed which period and how. Read only. */
export function ClassLogChanges({ changes }: { changes: ReadonlyArray<ClassLogChange> }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <ErgTable aria-label="Nhật ký sổ" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow>
            {["Thời gian", "Người sửa", "Lớp", "Tiết", "Thay đổi"].map((label) => <TableCell key={label} sx={headCellSx}>{label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {changes.map((c) => (
            <TableRow key={c.id}>
              <TableCell sx={{ ...bodyCellSx, color: t.color.textMuted, whiteSpace: "nowrap" }}>{changeTimeText(c.at)}</TableCell>
              <TableCell sx={bodyCellSx}>{c.actorName || "—"}</TableCell>
              <TableCell sx={{ ...bodyCellSx, fontWeight: t.type.label.fontWeight }}>{c.className}</TableCell>
              <TableCell sx={bodyCellSx}>{`Tiết ${c.periodNo} · ${weekdayVi(c.date)} ${shortDateVi(c.date)}`}</TableCell>
              <TableCell sx={bodyCellSx}>{changeText(c)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </ErgTable>
    </Box>
  );
}
