import { describe, expect, it } from "vitest";

import { denseBuckets } from "./punch-in-histogram";

describe("denseBuckets", () => {
  it("fills 06:00..09:30 in 15-minute steps with zeros for gaps", () => {
    const out = denseBuckets([{ time: "07:30", in: 4 }, { time: "07:45", in: 0 }]);
    expect(out[0]).toEqual({ time: "06:00", in: 0 });
    expect(out[out.length - 1]).toEqual({ time: "09:30", in: 0 });
    expect(out).toHaveLength(15);
    expect(out.find((b) => b.time === "07:30")?.in).toBe(4);
    expect(out.find((b) => b.time === "07:15")?.in).toBe(0);
  });

  it("widens the axis to buckets outside the default range and works with no data", () => {
    const out = denseBuckets([{ time: "05:45", in: 1 }, { time: "10:00", in: 2 }]);
    expect(out[0].time).toBe("05:45");
    expect(out[out.length - 1]).toEqual({ time: "10:00", in: 2 });
    expect(denseBuckets([])).toHaveLength(15);
  });
});
