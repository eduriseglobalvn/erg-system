import { afterEach, describe, expect, it, vi } from "vitest";
import { isRedirect } from "@tanstack/react-router";

import { catchAllBeforeLoad, legacyRoutes } from "@/routes/portals/legacy-routes";

type AnyRoute = { options: { path?: string; beforeLoad?: (ctx: unknown) => unknown } };

function outcome(fn: () => unknown) {
  try {
    fn();
    return "render";
  } catch (error) {
    if (!isRedirect(error)) throw error;
    return (error as unknown as { options: { href?: string; reloadDocument?: boolean } }).options;
  }
}

const atUrl = (url: string) => vi.stubGlobal("location", new URL(url));

describe("legacy redirects run in beforeLoad (no conditional <Navigate> renders)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("redirects the unconditional aliases", () => {
    const route = (path: string) => (legacyRoutes as unknown as AnyRoute[]).find((r) => r.options.path === path)!;
    expect(outcome(() => route("/teaching-schedule").options.beforeLoad!({}))).toMatchObject({ href: "/teacher/calendar" });
    expect(outcome(() => route("/homework/classes").options.beforeLoad!({}))).toMatchObject({ href: "/teacher/homework" });
  });

  it("sends an old /homework URL to /teacher/homework on the canonical host, keeping search", () => {
    atUrl("https://localhost:3001/homework?tab=2");
    const route = (legacyRoutes as unknown as AnyRoute[]).find((r) => r.options.path === "/homework")!;
    expect(outcome(() => route.options.beforeLoad!({}))).toMatchObject({ href: "/teacher/homework?tab=2" });
  });

  it("sends an old /homework URL on another ERG host to the canonical host with a document reload", () => {
    atUrl("https://crm.erg.edu.local/homework?tab=2");
    const route = (legacyRoutes as unknown as AnyRoute[]).find((r) => r.options.path === "/homework")!;
    expect(outcome(() => route.options.beforeLoad!({}))).toMatchObject({
      href: "https://lms.erg.edu.local/teacher/homework?tab=2",
      reloadDocument: true,
    });
  });

  it("maps catch-all aliases and renders 404 for unknown paths or foreign hosts", () => {
    atUrl("https://localhost:3001/dashboard/foo?tab=3");
    expect(outcome(catchAllBeforeLoad)).toMatchObject({ href: "https://lms.erg.edu.local:3001/teacher/foo?tab=3", reloadDocument: true });
    atUrl("https://localhost:3001/nothing-here");
    expect(outcome(catchAllBeforeLoad)).toBe("render");
    atUrl("https://evil.example.com/dashboard");
    expect(outcome(catchAllBeforeLoad)).toBe("render");
  });
});
