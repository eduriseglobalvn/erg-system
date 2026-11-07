import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import type { RecipientCard } from "../api/campaign-types";
import { addPicked, emptyDraft } from "../model/audience-draft";
import { AudienceEstimateView } from "./audience-estimate-line";
import { AudienceScopeChips } from "./audience-scope-chips";
import { PeoplePicker } from "./people-picker";
import { PickedPeopleSummary } from "./picked-people-summary";

const search = vi.hoisted(() => ({ data: undefined as RecipientCard[] | undefined }));
const resolve = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock("../api/campaign-query", () => ({
  usePeopleSearch: () => ({ data: search.data, isFetching: false }),
  useResolvePeople: () => ({ mutateAsync: resolve.mutateAsync, isPending: false }),
}));

const minh: RecipientCard = { userId: "u1", displayName: "Nguyễn Minh", role: "STUDENT", meta: "Học sinh · 7A · HS0712" };
const lan: RecipientCard = { userId: "u2", displayName: "Trần Lan", role: "STUDENT", meta: "Học sinh · 7A · HS0713" };

beforeEach(() => {
  search.data = undefined;
  resolve.mutateAsync.mockReset();
});

test("scope chips are a radiogroup; arrow keys select the next allowed scope", () => {
  const onChange = vi.fn();
  render(<AudienceScopeChips allowed={["CLASS", "GROUP", "PEOPLE"]} onChange={onChange} value="CLASS" />);
  expect(screen.getByRole("radiogroup", { name: "Gửi đến" })).toBeInTheDocument();
  expect(screen.getAllByRole("radio")).toHaveLength(3);
  expect(screen.getByRole("radio", { name: "Lớp" })).toHaveAttribute("aria-checked", "true");
  expect(screen.queryByRole("radio", { name: "Trường" })).toBeNull();
  screen.getByRole("radio", { name: "Lớp" }).focus();
  fireEvent.keyDown(screen.getByRole("radio", { name: "Lớp" }), { key: "ArrowRight" });
  expect(onChange).toHaveBeenCalledWith("GROUP");
});

test("estimate line formats the breakdown and shows the 422 error", () => {
  const { rerender } = render(
    <AudienceEstimateView breakdown={{ total: 126, teachers: 4, students: 98, picked: 3, duplicatesMerged: 2 }} />,
  );
  expect(screen.getByText("Ước tính 126 người nhận · 4 GV · 98 HS · 3 chọn riêng (trùng 2 đã gộp)")).toBeInTheDocument();
  expect(screen.getByText("Chỉ tính người có tài khoản.")).toBeInTheDocument();
  rerender(<AudienceEstimateView breakdown={{ total: 126 }} error={new Error("Tối đa 5.000 người nhận mỗi lần gửi")} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Tối đa 5.000 người nhận mỗi lần gửi");
  expect(screen.queryByText(/Ước tính 126/)).toBeNull();
});

test("people picker: type, arrow down, Enter picks the person", async () => {
  search.data = [minh, lan];
  const onChange = vi.fn();
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={onChange} />);
  const box = screen.getByRole("combobox");
  box.focus();
  fireEvent.change(box, { target: { value: "Mi" } });
  expect(screen.getByRole("listbox")).toBeInTheDocument();
  fireEvent.keyDown(box, { key: "ArrowDown" });
  fireEvent.keyDown(box, { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ picked: [minh] }));
});

test("'Chọn cả N' picks every result", async () => {
  search.data = [minh, lan];
  const onChange = vi.fn();
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Chọn cả 2" }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ picked: [minh, lan] }));
});

test("paste: matched go to picked, unmatched and ambiguous lines to errors", async () => {
  resolve.mutateAsync.mockResolvedValue({ matched: [minh], notFound: ["HS9999"], ambiguous: [{ line: "Lan", candidates: 2 }] });
  const onChange = vi.fn();
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Dán danh sách"), { target: { value: "HS0712\nHS9999\nLan" } });
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra danh sách" }));
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(resolve.mutateAsync).toHaveBeenCalledWith(["HS0712", "HS9999", "Lan"]);
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ picked: [minh], errors: ["HS9999", "Lan (khớp 2 người)"] }));
});

test("paste: more than 5,000 lines are capped and the user is told", async () => {
  resolve.mutateAsync.mockResolvedValue({ matched: [], notFound: [], ambiguous: [] });
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={vi.fn()} />);
  const lines = Array.from({ length: 5003 }, (_, i) => `HS${i}`).join("\n");
  fireEvent.change(screen.getByLabelText("Dán danh sách"), { target: { value: lines } });
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra danh sách" }));
  await waitFor(() => expect(resolve.mutateAsync).toHaveBeenCalled());
  expect(resolve.mutateAsync.mock.calls[0]?.[0]).toHaveLength(5000);
  expect(await screen.findByText(/Chỉ xử lý 5\.000 dòng đầu, bỏ 3 dòng/)).toBeInTheDocument();
});

test("picked summary shows 2 chips then '+N người' that opens the sheet", async () => {
  const cards = [minh, lan, { ...minh, userId: "u3" }, { ...minh, userId: "u4" }];
  const onOpenSheet = vi.fn();
  render(<PickedPeopleSummary draft={{ ...emptyDraft("PEOPLE"), picked: cards }} onChange={vi.fn()} onOpenSheet={onOpenSheet} />);
  fireEvent.click(screen.getByText("+2 người"));
  expect(onOpenSheet).toHaveBeenCalled();
  expect(screen.getByLabelText("Bỏ Trần Lan")).toBeInTheDocument();
});

test("scope chips: a value outside allowed leaves the first allowed chip tabbable", () => {
  render(<AudienceScopeChips allowed={["CLASS", "GROUP", "PEOPLE"]} onChange={vi.fn()} value="TENANT" />);
  const radios = screen.getAllByRole("radio");
  expect(radios.map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
  expect(radios.every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
});

test("people picker input is described by the 20-results hint", () => {
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={vi.fn()} />);
  const hint = screen.getByText("Hiện tối đa 20 kết quả.");
  expect(screen.getByRole("combobox").getAttribute("aria-describedby")).toContain(hint.id);
});

test("paste: a person picked while the list is resolving is kept", async () => {
  let finish: (v: unknown) => void = () => undefined;
  resolve.mutateAsync.mockReturnValue(new Promise((r) => { finish = r; }));
  const onChange = vi.fn();
  const { rerender } = render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("Dán danh sách"), { target: { value: "HS0712" } });
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra danh sách" }));
  rerender(<PeoplePicker draft={addPicked(emptyDraft("PEOPLE"), [lan])} onChange={onChange} />);
  finish({ matched: [minh], notFound: ["X1"], ambiguous: [] });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ picked: [lan, minh], errors: ["X1"] }));
});

test("file import: a person picked while the file is resolving is kept", async () => {
  let finish: (v: unknown) => void = () => undefined;
  resolve.mutateAsync.mockReturnValue(new Promise((r) => { finish = r; }));
  const onChange = vi.fn();
  const { rerender } = render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={onChange} />);
  const input = screen.getByLabelText("Chọn tệp danh sách người nhận");
  fireEvent.change(input, { target: { files: [new File(["HS0712\n"], "ds.csv")] } });
  await waitFor(() => expect(resolve.mutateAsync).toHaveBeenCalledWith(["HS0712"]));
  rerender(<PeoplePicker draft={addPicked(emptyDraft("PEOPLE"), [lan])} onChange={onChange} />);
  finish({ matched: [minh], notFound: [], ambiguous: [] });
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ picked: [lan, minh] }));
});

test("file import: an oversize file shows the size error and calls nothing", async () => {
  render(<PeoplePicker draft={emptyDraft("PEOPLE")} onChange={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Chọn tệp danh sách người nhận"), {
    target: { files: [new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.csv")] },
  });
  expect(await screen.findByText(/Tệp quá lớn \(tối đa 2 MB\)/)).toBeInTheDocument();
  expect(resolve.mutateAsync).not.toHaveBeenCalled();
});
