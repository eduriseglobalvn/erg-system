import { describe, expect, it } from "vitest";

import { nextCellKey } from "./use-grid-keyboard";
import { parseGridPaste } from "./use-grid-paste";

const context = {
  classes: [{ id: "c1", name: "9A1" }, { id: "c2", name: "9A2" }, { id: "c3", name: "9A3" }],
  periods: [1, 2, 3, 4, 6, 7],
  rooms: [{ id: "r1", name: "PM 01" }],
  teachers: [{ id: "t1", name: "Q.Vương" }],
};

describe("parseGridPaste", () => {
  it("maps a 3x2 TSV block from the anchor cell to 6 rows", () => {
    const { rows, unknown } = parseGridPaste("9A1\t9A2\n9A2\t9A3\n9A3\t9A1", "2:3", context);
    expect(unknown).toEqual([]);
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => `${row.weekday}:${row.periodNo}:${row.className}`)).toEqual([
      "2:3:9A1", "3:3:9A2", "2:4:9A2", "3:4:9A3", "2:6:9A3", "3:6:9A1",
    ]);
  });

  it("reads Lớp / Phòng / GV and turns an unknown room into a new room", () => {
    const { rows } = parseGridPaste("9A1 / PM 01 / Q.Vương\n9A2 / PM 09", "1:1", context);
    expect(rows[0]).toMatchObject({ roomId: "r1", teacherId: "t1" });
    expect(rows[1]).toMatchObject({ newRoomName: "PM 09", roomId: undefined });
  });

  it("reports unknown class and teacher names instead of creating the row", () => {
    const { rows, unknown } = parseGridPaste("XYZ\n9A1 / PM 01 / Ai Do", "1:1", context);
    expect(rows).toHaveLength(0);
    expect(unknown).toEqual([{ key: "1:1", name: "XYZ" }, { key: "1:2", name: "Ai Do" }]);
  });

  it("drops cells that fall past Saturday", () => {
    expect(parseGridPaste("9A1\t9A2\t9A3", "5:1", context).rows).toHaveLength(2);
  });
});

describe("nextCellKey", () => {
  const periods = [1, 2, 3];
  it("moves with arrows and stops at the edges", () => {
    expect(nextCellKey("1:1", "ArrowRight", false, periods)).toBe("2:1");
    expect(nextCellKey("1:1", "ArrowUp", false, periods)).toBeNull();
    expect(nextCellKey("6:3", "ArrowDown", false, periods)).toBeNull();
  });

  it("wraps Tab to the next row and Shift+Tab back", () => {
    expect(nextCellKey("6:1", "Tab", false, periods)).toBe("1:2");
    expect(nextCellKey("1:2", "Tab", true, periods)).toBe("6:1");
  });
});
