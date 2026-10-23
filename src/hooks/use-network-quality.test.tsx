import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { useAdaptiveLoadingPolicy } from "@/hooks/use-network-quality";

describe("useAdaptiveLoadingPolicy", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("reacts to connection change events and removes listeners", () => {
    const connection = new EventTarget() as EventTarget & { effectiveType: "3g" | "4g"; saveData: boolean };
    connection.effectiveType = "4g";
    connection.saveData = false;
    const removeSpy = vi.spyOn(connection, "removeEventListener");
    vi.stubGlobal("navigator", { connection, onLine: true });

    const { result, unmount } = renderHook(() => useAdaptiveLoadingPolicy());
    expect(result.current.mode).toBe("full");

    act(() => {
      connection.effectiveType = "3g";
      connection.dispatchEvent(new Event("change"));
    });
    expect(result.current.mode).toBe("reduced");

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
