import { expect, test } from "vitest";

import {
  buildStudentLogins,
  credentialsCsv,
  credentialsSheetColumns,
  generatePassword,
} from "@/features/lcms/school-management/utils/student-account-credentials";

test("builds ascii logins from the Vietnamese name and class, numbering repeats", () => {
  const logins = buildStudentLogins(
    [
      { fullName: "Nguyễn Minh Trâm Anh", className: "9A1" },
      { fullName: "Đặng Bảo Chúc", className: "9A1" },
      { fullName: "Trần Văn An", className: "9A1" },
      { fullName: "Lê Thị An", className: "9A1" },
      { fullName: "", className: "9A1" },
    ],
    () => 0,
  );

  expect(logins.map((login) => login?.username)).toEqual([
    "anh.nguyen.9a1",
    "chuc.dang.9a1",
    "an.tran.9a1",
    "an.le.9a1",
    undefined,
  ]);
});

test("repeated name and class in one batch gets a number", () => {
  const logins = buildStudentLogins(
    [{ fullName: "Võ An", className: "9A1" }, { fullName: "Vo An", className: "9A1" }],
    () => 0,
  );
  expect(logins.map((login) => login?.username)).toEqual(["an.vo.9a1", "an.vo.9a12"]);
});

test("passwords are 8 characters without look-alike characters", () => {
  const password = generatePassword();
  expect(password).toMatch(/^[a-hj-km-np-z2-9]{8}$/);
});

test("csv quotes cells and the sheet columns keep the import order with blanks", () => {
  const csv = credentialsCsv([{ code: "9A1-2", fullName: 'An, "A"', className: "9A1", username: "an.9a1", password: "pw" }]);
  expect(csv).toContain('"An, ""A"""');
  expect(csv.startsWith("﻿Mã,")).toBe(true);
  expect(credentialsSheetColumns([{ username: "a", password: "1" }, null, { username: "b", password: "2" }])).toBe("a\t1\n\t\nb\t2");
});
