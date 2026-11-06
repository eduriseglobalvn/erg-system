export type GridSurface = "web" | "phone";
export type QuestionGridLayout = {
  columns: 5 | 8 | 10;
  cell: number;
  gap: number;
  fontSize: "body" | "caption";
  scroll: boolean;
  showGoTo: boolean;
};

// Grid sizing from the P3 plan: <=20 questions stay roomy, then the grid compacts and finally scrolls.
export function questionGridLayout(total: number, surface: GridSurface): QuestionGridLayout {
  const phone = surface === "phone";
  if (total <= 20) return { columns: 5, cell: phone ? 48 : 40, gap: 8, fontSize: "body", scroll: false, showGoTo: false };
  const scroll = phone || total > 100;
  return phone
    ? { columns: 8, cell: 38, gap: 8, fontSize: "body", scroll, showGoTo: true }
    : { columns: 10, cell: 30, gap: 6, fontSize: "caption", scroll, showGoTo: true };
}
