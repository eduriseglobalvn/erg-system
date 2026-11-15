import { cellKey, newClientRowId, parseCellKey, WEEKDAYS, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";

type Named = { id: string; name: string };

export type GridPasteContext = {
  classes: readonly Named[];
  /** Tiet co the xep (khong gom tiet trong gio), theo thu tu hang. */
  periods: readonly number[];
  rooms: readonly Named[];
  teachers: readonly Named[];
};

export type GridPasteResult = {
  rows: GridRow[];
  /** O dan khong khop ten lop / giao vien: danh dau do, panel xung dot ghi «Không tìm thấy “<tên>”». */
  unknown: Array<{ key: string; name: string }>;
};

const normalize = (value: string) => value.normalize("NFC").replace(/\s+/g, "").toLocaleLowerCase("vi");
const find = (list: readonly Named[], name: string) => list.find((item) => normalize(item.name) === normalize(name));

/**
 * Dan vung copy tu Excel (TSV hang x cot) bat dau tu o `anchor`. Moi o la "Lớp / Phòng / GV" hoac chi "Lớp".
 * Phong khong khop duoc coi la phong moi (newRoomName); lop hoac giao vien khong khop thi bao khong tim thay.
 */
export function parseGridPaste(text: string, anchor: string, context: GridPasteContext): GridPasteResult {
  const start = parseCellKey(anchor);
  const startRow = context.periods.indexOf(start.periodNo);
  const rows: GridRow[] = [];
  const unknown: GridPasteResult["unknown"] = [];
  if (startRow < 0) return { rows, unknown };

  text.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n").forEach((line, i) => {
    line.split("\t").forEach((raw, j) => {
      const periodNo = context.periods[startRow + i];
      const weekday = start.weekday + j;
      const value = raw.trim();
      if (!value || periodNo === undefined || weekday > WEEKDAYS[WEEKDAYS.length - 1]) return;
      const key = cellKey(weekday, periodNo);
      const [classPart, roomPart, teacherPart] = value.split("/").map((part) => part.trim());
      const klass = find(context.classes, classPart);
      if (!klass) { unknown.push({ key, name: classPart }); return; }
      const teacher = teacherPart ? find(context.teachers, teacherPart) : undefined;
      if (teacherPart && !teacher) { unknown.push({ key, name: teacherPart }); return; }
      const room = roomPart ? find(context.rooms, roomPart) : undefined;
      rows.push({
        classId: klass.id,
        className: klass.name,
        clientRowId: newClientRowId(),
        newRoomName: roomPart && !room ? roomPart : undefined,
        periodNo,
        roomId: room?.id,
        roomName: room?.name,
        teacherId: teacher?.id,
        teacherName: teacher?.name,
        weekday,
      });
    });
  });
  return { rows, unknown };
}
