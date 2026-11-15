import { expect, it } from "vitest";

import { overlapClusters, teacherTone } from "./teacher-tone";

it("gives the same tone to the same teacher", () => {
  expect(teacherTone("abc-123")).toBe(teacherTone("abc-123"));
});

it("puts overlapping events in one cluster and consecutive ones in separate clusters", () => {
  const e = (startTime: string, endTime: string) => ({ endTime, startTime });
  const clusters = overlapClusters([e("13:00", "13:45"), e("07:00", "07:45"), e("13:30", "14:15"), e("07:45", "08:30")]);
  expect(clusters.map((cluster) => cluster.length)).toEqual([1, 1, 2]);
  expect(clusters[2].map((item) => item.startTime)).toEqual(["13:00", "13:30"]);
});
