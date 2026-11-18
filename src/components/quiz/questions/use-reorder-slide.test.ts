import { expect, test } from "vitest";

import { slideOffsets } from "@/components/quiz/questions/use-reorder-slide";

const rect = (left: number, top: number) => ({ left, top }) as DOMRect;

test("an item's place is measured inside its container, so scrolling the page is not read as a move", () => {
  const before = slideOffsets(rect(10, 100), [{ key: "a", rect: rect(10, 100) }, { key: "b", rect: rect(10, 160) }]);
  const afterScroll = slideOffsets(rect(10, -200), [{ key: "a", rect: rect(10, -200) }, { key: "b", rect: rect(10, -140) }]);

  expect(afterScroll.get("a")).toEqual(before.get("a"));
  expect(afterScroll.get("b")).toEqual({ x: 0, y: 60 });
});
