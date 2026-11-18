import { describe, expect, it } from "vitest";

import { parsePortableRoster } from "./portable-exam-identity";

describe("parsePortableRoster", () => {
  it("keeps a well-formed roster", () => {
    expect(parsePortableRoster({ classes: [{ code: " 10A1 ", students: [{ code: "HS001", name: "An" }] }] }))
      .toEqual({ classes: [{ code: "10A1", students: [{ code: "HS001", name: "An" }] }] });
  });

  it.each([undefined, null, {}, { classes: [] }, { classes: [{ code: "", students: [] }] }, { classes: [{ code: "A", students: [{ code: 1 }] }] }])(
    "rejects malformed %j",
    (value) => expect(parsePortableRoster(value)).toBeUndefined(),
  );
});
