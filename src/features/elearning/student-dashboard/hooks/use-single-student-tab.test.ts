import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { useSingleStudentTab } from "./use-single-student-tab";

it("replaces the older tab of the same account, and taking it back replaces the newer one", async () => {
  const first = renderHook(() => useSingleStudentTab("student-1"));
  const second = renderHook(() => useSingleStudentTab("student-1"));

  await waitFor(() => expect(first.result.current.replaced).toBe(true));
  expect(second.result.current.replaced).toBe(false);

  act(() => first.result.current.claim());
  await waitFor(() => expect(second.result.current.replaced).toBe(true));
  expect(first.result.current.replaced).toBe(false);

  first.unmount();
  second.unmount();
});

it("leaves tabs of another account alone", async () => {
  const mine = renderHook(() => useSingleStudentTab("student-1"));
  const other = renderHook(() => useSingleStudentTab("student-2"));
  const probe = renderHook(() => useSingleStudentTab("student-2"));

  await waitFor(() => expect(other.result.current.replaced).toBe(true));
  expect(mine.result.current.replaced).toBe(false);

  mine.unmount();
  other.unmount();
  probe.unmount();
});
