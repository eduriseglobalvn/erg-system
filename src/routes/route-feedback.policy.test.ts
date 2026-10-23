import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const routesRoot = path.resolve(process.cwd(), "src/routes");
const readRouteSource = (name: string) => fs.readFileSync(path.join(routesRoot, name), "utf8");

describe("route loading and error feedback ownership", () => {
  test("keeps shared route feedback MUI-first and small", () => {
    const feedback = readRouteSource("route-feedback.tsx");

    expect(feedback.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(feedback).toContain('from "@mui/material/Skeleton"');
    expect(feedback).toContain("router.invalidate()");
    expect(feedback).not.toContain("CircularProgress");
    expect(feedback).not.toContain("className=");
  });

  test("uses the shared feedback for React lazy and TanStack Router boundaries", () => {
    const routes = readRouteSource("app-routes.tsx");

    expect(routes).toContain('from "@/routes/route-feedback"');
    expect(routes).toContain("defaultPendingComponent: RoutePendingSkeleton");
    expect(routes).toContain("defaultErrorComponent: RouteErrorBoundary");
    expect(routes).not.toContain("function RouteFallback");
    expect(routes).not.toContain("<RouteFallback />");
  });
});
