import {
  attendanceLabel,
  attendanceSummary,
  getAttendanceBgColor,
  getAttendanceTextColor,
} from "./attendance-sheet-model";
import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

export function AttendanceStudentTable({ controller }: { controller: AttendanceSheetController }) {
  return (
    <div
      ref={controller.tableScrollRef}
      style={{ minHeight: 0, overflow: "auto", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}
    >
      <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th style={thStyle(40)}>STT</th>
            <th style={thStyle(180)}>Học sinh</th>
            <th style={thStyle(56)}>Vắng</th>
            {controller.dateColumns.map((column) => (
              <th
                key={column.id}
                style={{
                  ...thStyle(44),
                  backgroundColor: column.isFocusDate ? "#EEF2FF" : "#f8fafc",
                  borderLeft: column.isFocusDate ? "2px solid #696CFF" : "none",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700 }}>{column.day}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#6b7280" }}>{column.date}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {controller.measuredVirtualRows.length ? (
            <tr aria-hidden="true">
              <td colSpan={controller.dateColumns.length + 3} style={{ height: controller.measuredVirtualRows[0].start, padding: 0, border: 0 }} />
            </tr>
          ) : null}
          {controller.measuredVirtualRows.map((virtualRow) => {
            const index = virtualRow.index;
            const student = controller.filteredStudents[index];
            if (!student) return null;
            const statuses = controller.dateColumns.map((column, columnIndex) => controller.statusFor(student.id, index, column, columnIndex));
            const summary = attendanceSummary(statuses);

            return (
              <tr key={student.id} style={{ height: virtualRow.end - virtualRow.start }}>
                <td style={tdStyle(40, "center")}>{index + 1}</td>
                <td style={tdStyle(180)}>
                  <button
                    onClick={() => controller.openStudentDetail(student)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      controller.setContextMenu({ x: event.clientX, y: event.clientY, student });
                    }}
                    style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: "#696CFF", cursor: "pointer", textAlign: "left" }}
                  >
                    {controller.studentDrafts[student.id]?.name ?? student.name}
                  </button>
                </td>
                <td style={tdStyle(56, "center")}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      backgroundColor: summary.absent ? "#fee2e2" : "#dcfce7",
                      color: summary.absent ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {summary.absent}
                  </span>
                </td>
                {controller.dateColumns.map((column, columnIndex) => {
                  const status = statuses[columnIndex];
                  return (
                    <td
                      key={column.id}
                      style={{
                        ...tdStyle(44, "center"),
                        backgroundColor: getAttendanceBgColor(status, column.isFocusDate),
                        borderLeft: column.isFocusDate ? "2px solid #696CFF" : "none",
                        cursor: column.isFutureDate ? "not-allowed" : "pointer",
                      }}
                    >
                      <button
                        onClick={() => controller.updateAttendance(student.id, index, column, columnIndex)}
                        disabled={column.isFutureDate}
                        style={{
                          width: "100%",
                          height: 28,
                          border: "none",
                          borderRadius: 4,
                          backgroundColor: "transparent",
                          cursor: column.isFutureDate ? "not-allowed" : "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          color: getAttendanceTextColor(status),
                        }}
                      >
                        {attendanceLabel(status)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {controller.measuredVirtualRows.length ? (
            <tr aria-hidden="true">
              <td
                colSpan={controller.dateColumns.length + 3}
                style={{ height: Math.max(0, controller.virtualTotalSize - controller.measuredVirtualRows.at(-1)!.end), padding: 0, border: 0 }}
              />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = (width?: string | number) => ({
  padding: "8px 4px",
  border: "1px solid #e5e7eb",
  borderTop: "none",
  fontSize: 11,
  fontWeight: 700,
  textAlign: "center" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
  width,
});

const tdStyle = (width?: string | number, textAlign: "left" | "center" = "left") => ({
  padding: "4px",
  border: "1px solid #e5e7eb",
  textAlign,
  width,
});
