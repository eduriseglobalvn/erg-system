import { expect, it } from "vitest";

import { mapDirectorySchool, studentDisplayStatus, toApiStatus } from "./mappers";

it("shows enrolled and active students as studying, whatever the letter case", () => {
  expect(["ACTIVE", "active", "ENROLLED"].map(studentDisplayStatus)).toEqual(["studying", "studying", "studying"]);
  expect(studentDisplayStatus("AT_RISK")).toBe("at-risk");
  expect(studentDisplayStatus("INACTIVE")).toBe("inactive");
});

it("keeps archived schools apart from paused ones", () => {
  const status = (value: string) => mapDirectorySchool({ schoolType: "SECONDARY", status: value } as Parameters<typeof mapDirectorySchool>[0]).status;
  expect(["ARCHIVED", "PAUSED", "SUSPENDED"].map(status)).toEqual(["archived", "paused", "paused"]);
  expect(toApiStatus("archived")).toBe("ARCHIVED");
});
