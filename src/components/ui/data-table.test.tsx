import { fireEvent, render, screen } from "@testing-library/react";
import type { ColumnDef } from "@tanstack/react-table";
import { expect, test } from "vitest";

import { DataTable } from "@/components/ui/data-table";

type Row = {
  name: string;
  score: number;
};

const columns: Array<ColumnDef<Row>> = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "score",
    header: "Score",
  },
];

test("DataTable renders rows and supports header sorting", () => {
  render(
    <DataTable
      columns={columns}
      data={[
        { name: "B", score: 20 },
        { name: "A", score: 10 },
      ]}
    />,
  );

  expect(screen.getByText("A")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Name" }));

  const cells = screen.getAllByRole("cell").map((cell) => cell.textContent);
  expect(cells.slice(0, 4)).toEqual(["A", "10", "B", "20"]);
});

test("DataTable supports filtering, pagination, and row selection", async () => {
  render(
    <DataTable
      columns={columns}
      data={[
        { name: "Alpha", score: 10 },
        { name: "Beta", score: 20 },
        { name: "Gamma", score: 30 },
      ]}
      pageSize={2}
      selectable
    />,
  );

  expect(screen.getByText("Alpha")).toBeInTheDocument();
  expect(screen.queryByText("Gamma")).not.toBeInTheDocument();

  expect(screen.getAllByRole("checkbox", { name: "Ch\u1ecdn d\u00f2ng" })).toHaveLength(2);

  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByText("Gamma")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Tìm kiếm"), { target: { value: "beta" } });
  expect(screen.getByText("Beta")).toBeInTheDocument();
  expect(screen.queryByText("Alpha")).not.toBeInTheDocument();

});
