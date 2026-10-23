import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("portable build is a question-only entry without portal chrome or remote API access", () => {
  const html = readFileSync("portable.html", "utf8");
  const entry = readFileSync("src/portable-main.tsx", "utf8");
  const app = readFileSync("src/features/elearning/portable-exam/components/portable-artifact-app.tsx", "utf8");
  const viteConfig = readFileSync("vite.portable.config.ts", "utf8");
  const config = JSON.parse(readFileSync("src-tauri/tauri.portable.template.json", "utf8"));
  const builder = readFileSync("scripts/build-portable-exam.mjs", "utf8");

  assert.match(html, /src\/portable-main\.tsx/);
  assert.match(entry, /PortableArtifactApp/);
  assert.doesNotMatch(entry, /RouterProvider|App from|Portal|Auth/);
  assert.match(app, /PlayerShellRuntime/);
  assert.match(app, /startImmediately/);
  assert.doesNotMatch(app, /welcomeMeta/);
  assert.doesNotMatch(app, /CircularProgress/);
  assert.doesNotMatch(app, /PortableExamLauncher|LmsTeacherShell|StudentDashboardMobileShell|TopMenuShell/);
  assert.match(viteConfig, /dist-portable\/index\.html/);
  assert.match(viteConfig, /publicDir:\s*false/);
  assert.equal(config.app.windows[0].fullscreen, true);
  assert.deepEqual(config.app.security.capabilities, []);
  assert.doesNotMatch(config.app.security.csp, /https:/);
  assert.equal(config.bundle.createUpdaterArtifacts, false);
  assert.match(builder, /--package/);
  assert.match(builder, /portable-exam\.ergquiz/);
  assert.match(builder, /tauri.*build/s);
  assert.match(builder, /--prepare-only/);
  assert.match(builder, /VITE_PORTABLE_PACKAGE_PUBLIC_KEYS/);
  assert.match(builder, /signatureBlock\?\.publicKeyId/);
});
