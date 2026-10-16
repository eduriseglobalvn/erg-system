import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "src");
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) files.push(full);
  }
}
walk(sourceRoot);
const violations = [];
// Existing legacy surfaces are intentionally grandfathered; new files must use
// path imports so they do not inflate the shared MUI chunk.
const allowlist = new Set([
  "src/components/portal/ErgPortalHeader.tsx", "src/components/portal/ErgPortalLayout.tsx", "src/components/portal/ErgPortalSidebar.tsx",
  "src/components/shared/DashboardCard.tsx", "src/components/shared/DataTable.tsx", "src/components/shared/erg-calendar-workspace.tsx",
  "src/components/shared/PageHeader.tsx", "src/components/shared/StatusBadge.tsx", "src/features/lcms/admin-operations/components/learning-resource-authoring-icons.tsx",
  "src/features/lcms/lcms-erg-portal-shell.tsx", "src/features/lcms/pages/lcms-dashboard.tsx", "src/features/lcms/pages/lcms-erg-workspaces.tsx",
  "src/features/lcms/quiz/quiz-editor/components/question-editor-dialog.tsx", "src/features/lcms/quiz/quiz-editor/components/ribbon/form-view-ribbon.tsx",
  "src/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus.tsx", "src/features/lms/components/attendance-sheet-panel.tsx",
  "src/features/lms/components/homework-panel.tsx", "src/features/lms/components/lms-notification-center.tsx", "src/features/lms/components/lms-teacher-shell.tsx",
  "src/features/lms/components/score-sheet-panel.tsx", "src/features/lms/components/student-groups-page.tsx", "src/features/lms/weekly-class-log/components/weekly-class-log-page.tsx",
]);
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  if (!allowlist.has(relative) && (/from\s+["']@mui\/material["']/.test(source) || /from\s+["']@mui\/icons-material["']/.test(source))) {
    violations.push(path.relative(root, file));
  }
}
if (violations.length) {
  console.error(`MUI barrel imports detected:\n${violations.map((file) => `- ${file}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`No MUI barrel imports found in ${files.length} source files.`);
}
