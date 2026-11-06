import { describe, expect, it } from "vitest";

import {
  parsePortableRoster,
  portableIdentityAccountId,
  validatePortableIdentity,
} from "./portable-exam-identity";

const roster = parsePortableRoster({
  classes: [{ code: "10A1", name: "10A1", students: [{ code: "HS001", name: "An" }, { code: "HS002" }] }],
})!;

describe("validatePortableIdentity without a roster (free text + format check)", () => {
  it.each([
    ["10A1", "HS001", true],
    ["  10a1 ", " hs-001 ", true],
    ["", "HS001", false],
    ["10A1", "", false],
    ["1", "HS001", false],
    ["10A1", "HS 001", false],
    ["10A1", "học sinh", false],
    ["10A1", "x".repeat(33), false],
  ])("class %j student %j -> %s", (classCode, studentCode, ok) => {
    expect(validatePortableIdentity({ classCode, studentCode }).ok).toBe(ok);
  });

  it("trims and keeps the typed spelling", () => {
    expect(validatePortableIdentity({ classCode: " 10a1 ", studentCode: " hs001" })).toEqual({
      ok: true,
      identity: { classCode: "10a1", studentCode: "hs001" },
    });
  });

  it("reports which field is wrong", () => {
    const result = validatePortableIdentity({ classCode: "", studentCode: "!" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["classCode", "studentCode"]);
  });
});

describe("validatePortableIdentity with a roster", () => {
  it("accepts a listed student case-insensitively and returns the roster spelling", () => {
    expect(validatePortableIdentity({ classCode: "10a1", studentCode: "hs002" }, roster)).toEqual({
      ok: true,
      identity: { classCode: "10A1", studentCode: "HS002" },
    });
  });

  it("rejects an unknown class and an unknown student", () => {
    expect(validatePortableIdentity({ classCode: "11B", studentCode: "HS001" }, roster)).toMatchObject({ ok: false, errors: { classCode: expect.any(String) } });
    expect(validatePortableIdentity({ classCode: "10A1", studentCode: "HS999" }, roster)).toMatchObject({ ok: false, errors: { studentCode: expect.any(String) } });
  });
});

describe("portableIdentityAccountId", () => {
  it("is stable across spelling differences", () => {
    expect(portableIdentityAccountId({ classCode: "10a1", studentCode: "hs001" })).toBe("portable:10A1:HS001");
  });
});

describe("parsePortableRoster", () => {
  it.each([undefined, null, {}, { classes: [] }, { classes: [{ code: "", students: [] }] }, { classes: [{ code: "A", students: [{ code: 1 }] }] }])(
    "rejects malformed %j",
    (value) => expect(parsePortableRoster(value)).toBeUndefined(),
  );
});
