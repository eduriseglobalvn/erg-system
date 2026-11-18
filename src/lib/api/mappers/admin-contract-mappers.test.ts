import { expect, it } from "vitest";

import { mapEmployeeListDto } from "./admin-contract-mappers";

it("keeps the INVITED status of a new employee instead of turning it into UNKNOWN", () => {
  const dto = { users: [{ id: "u1", status: "invited" }, { id: "u2", status: "something-else" }] } as Parameters<typeof mapEmployeeListDto>[0];
  expect(mapEmployeeListDto(dto).users.map((item) => item.status)).toEqual(["INVITED", "UNKNOWN"]);
});
