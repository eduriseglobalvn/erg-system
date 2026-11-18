import { expect, test } from "vitest";

import {
  buildStudentLogins,
  credentialsCsv,
  credentialsSheetColumns,
  schoolLoginPrefix,
} from "@/features/lcms/school-management/utils/student-account-credentials";

test("login is <school>.<full name><4 digits> and the password is the same string", () => {
  const logins = buildStudentLogins(
    [{ fullName: "Nguyễn Văn A" }, { fullName: "Đặng Bảo Chúc" }, { fullName: "" }],
    "THCS Trương Công Định",
    () => 123,
  );
  expect(logins).toEqual([
    { username: "thcstcd.nguyenvana0123", password: "thcstcd.nguyenvana0123" },
    { username: "thcstcd.dangbaochuc0123", password: "thcstcd.dangbaochuc0123" },
    null,
  ]);
});

test("the same name twice in one batch never gets the same digits", () => {
  const logins = buildStudentLogins([{ fullName: "Võ An" }, { fullName: "Vo An" }], "Tiểu học Vân Đồn", () => 9999);
  expect(logins.map((login) => login?.username)).toEqual(["thvd.voan9999", "thvd.voan0000"]);
});

test("school prefix keeps abbreviations whole and drops the word Trường", () => {
  expect(schoolLoginPrefix("Trường THCS Vân Đồn")).toBe("thcsvd");
  expect(schoolLoginPrefix("THPT Chuyên ERG")).toBe("thptcerg");
});

test("csv quotes cells and the sheet columns keep the import order with blanks", () => {
  const csv = credentialsCsv([{ code: "9A1-2", fullName: 'An, "A"', className: "9A1", username: "an.9a1", password: "pw" }]);
  expect(csv).toContain('"An, ""A"""');
  expect(csv.startsWith("﻿Mã,")).toBe(true);
  expect(credentialsSheetColumns([{ username: "a", password: "1" }, null, { username: "b", password: "2" }])).toBe("a\t1\n\t\nb\t2");
});
