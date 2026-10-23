import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_EXTENSIONS = new Set([".css", ".js", ".json", ".mjs", ".ts", ".tsx"]);
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".superpowers",
  "__tests__",
  "dist",
  "node_modules",
  "test",
  "tests",
]);

const LEGACY_MODULE_PATTERN = /(?:from\s*|import\s*\(|require\s*\()\s*["'](?:lucide-react|radix-ui|@radix-ui\/[^"']+|tailwind-merge|class-variance-authority|cmdk)["']/g;
const TAILWIND_DIRECTIVE_PATTERN = /@(?:apply|config|custom-variant|import\s+["']tailwindcss["']|plugin|reference|source|tailwind|theme|utility|variant)\b/g;
const TAILWIND_BUILD_PATTERN = /@tailwindcss\/vite|\btailwindcss\s*\(/g;
const LEGACY_DEPENDENCIES = new Set([
  "@tailwindcss/vite",
  "class-variance-authority",
  "cmdk",
  "lucide-react",
  "radix-ui",
  "tailwind-merge",
  "tailwindcss",
  "tw-animate-css",
]);

const ALLOWED_SEMANTIC_CLASS = /^(?:Mui|dnd-|fc-|lms-teacher-shell$|matching-|pdf-|quiz-)/;
const UTILITY_CLASS_PATTERN = /^(?:!|\[|\*|after:|before:|dark:|data-|disabled:|first:|focus:|focus-visible:|group-|has-|hover:|last:|lg:|md:|peer-|placeholder:|read-only:|sm:|supports-|xl:|2xl:|active:|aria-|motion-|print:|odd:|even:|visited:|container$|sr-only$|not-sr-only$|block$|inline$|inline-block$|inline-flex$|flex$|grid$|hidden$|contents$|table$|flow-root$|static$|fixed$|absolute$|relative$|sticky$|isolate$|object-|overflow-|overscroll-|inset-|top-|right-|bottom-|left-|z-|order-|col-|row-|float-|clear-|m[trblxy]?-(?:\[|\d|auto|px)|p[trblxy]?-(?:\[|\d|px)|space-[xy]-|gap-(?:\[|\d|px)|w-(?:\[|\d|auto|full|screen|fit|min|max|px)|h-(?:\[|\d|auto|full|screen|fit|min|max|px)|min-[wh]-|max-[wh]-|size-|grow$|grow-|shrink$|shrink-|basis-|grid-cols-|grid-rows-|auto-cols-|auto-rows-|items-|justify-|content-|self-|place-|divide-|bg-|from-|via-|to-|border$|border-|rounded$|rounded-|shadow$|shadow-|opacity-|mix-blend-|text-(?:\[|\d|xs|sm|base|lg|xl|left|center|right|justify|start|end|ellipsis|clip|wrap|nowrap|balance|pretty|transparent|current|black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)|font-|tracking-|leading-|list-|truncate$|whitespace-|break-|hyphens-|align-|uppercase$|lowercase$|capitalize$|normal-case$|italic$|not-italic$|underline$|overline$|line-through$|no-underline$|decoration-|transition$|transition-|duration-|ease-|delay-|animate-|transform$|translate-|rotate-|scale-|skew-|origin-|cursor-|select-|resize-|scroll-|snap-|touch-|pointer-events-|appearance-|accent-|caret-|fill-|stroke-|outline$|outline-|ring$|ring-|blur$|blur-|brightness-|contrast-|drop-shadow-|grayscale$|hue-rotate-|invert$|saturate-|sepia$|backdrop-|aspect-|columns-|break-before-|break-after-|break-inside-|box-decoration-|box-border$|box-content$|caption-|empty-cells-|table-auto$|table-fixed$|border-collapse$|border-separate$)/;

function collectFiles(entryPath) {
  const absolutePath = resolve(entryPath);
  if (!existsSync(absolutePath)) {
    return [];
  }

  const stats = statSync(absolutePath);
  if (stats.isFile()) {
    return SOURCE_EXTENSIONS.has(extname(absolutePath)) ? [absolutePath] : [];
  }

  const files = [];
  for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    files.push(...collectFiles(resolve(absolutePath, entry.name)));
  }
  return files;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function excerptAt(source, index) {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const nextLine = source.indexOf("\n", index);
  const lineEnd = nextLine === -1 ? source.length : nextLine;
  return source.slice(lineStart, lineEnd).trim().slice(0, 180);
}

function addPatternViolations(violations, file, source, pattern, rule) {
  pattern.lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    violations.push({
      excerpt: excerptAt(source, match.index),
      file,
      line: lineNumberAt(source, match.index),
      rule,
    });
  }
}

function quotedSegments(expression) {
  const values = [];
  const pattern = /["'`]([^"'`]*)["'`]/g;
  for (const match of expression.matchAll(pattern)) {
    values.push({ index: match.index + 1, value: match[1] });
  }
  return values;
}

function findUtilityClassViolations(file, source) {
  const violations = [];
  const classNamePattern = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{([\s\S]*?)\})/g;

  for (const classNameMatch of source.matchAll(classNamePattern)) {
    const expression = classNameMatch[1] ?? classNameMatch[2] ?? classNameMatch[3] ?? classNameMatch[4] ?? "";
    const segments = classNameMatch[4]
      ? quotedSegments(expression)
      : [{ index: 0, value: expression }];

    for (const segment of segments) {
      for (const token of segment.value.split(/\s+/).filter(Boolean)) {
        const normalized = token.replace(/^\$\{.*?\}$/, "");
        if (!normalized || ALLOWED_SEMANTIC_CLASS.test(normalized)) {
          continue;
        }
        if (UTILITY_CLASS_PATTERN.test(normalized)) {
          const index = classNameMatch.index + segment.index;
          violations.push({
            excerpt: excerptAt(source, index),
            file,
            line: lineNumberAt(source, index),
            rule: `tailwind-utility:${normalized}`,
          });
        }
      }
    }
  }

  return violations;
}

function findPackageViolations(file, source) {
  if (!file.endsWith("package.json")) {
    return [];
  }

  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch {
    return [];
  }

  const violations = [];
  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const dependency of Object.keys(manifest[section] ?? {})) {
      if (LEGACY_DEPENDENCIES.has(dependency) || dependency.startsWith("@radix-ui/")) {
        const index = source.indexOf(`"${dependency}"`);
        violations.push({
          excerpt: excerptAt(source, Math.max(index, 0)),
          file,
          line: lineNumberAt(source, Math.max(index, 0)),
          rule: `legacy-dependency:${dependency}`,
        });
      }
    }
  }
  return violations;
}

export function scanLegacyUi(paths) {
  const files = [...new Set(paths.flatMap(collectFiles))].sort();
  const violations = [];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    addPatternViolations(violations, file, source, LEGACY_MODULE_PATTERN, "legacy-import");
    addPatternViolations(violations, file, source, TAILWIND_DIRECTIVE_PATTERN, "tailwind-directive");
    addPatternViolations(violations, file, source, TAILWIND_BUILD_PATTERN, "tailwind-build");
    violations.push(...findPackageViolations(file, source));
    if (file.endsWith(".tsx")) {
      violations.push(...findUtilityClassViolations(file, source));
    }
  }

  return violations;
}

const DEFAULT_SCAN_PATHS = ["src", "package.json", "vite.config.ts"];
const DEFAULT_BASELINE_PATH = "scripts/legacy-ui-baseline.json";
const LEGACY_FILE_OWNERS = new Map([
  [
    "src/features/lms/components/lms-teacher-shell-config.tsx",
    "src/features/lms/components/lms-teacher-shell.tsx",
  ],
  [
    "src/features/lms/components/lms-teacher-shell-presentation.tsx",
    "src/features/lms/components/lms-teacher-shell.tsx",
  ],
  [
    "src/features/lms/components/lms-teacher-shell-workspaces.tsx",
    "src/features/lms/components/lms-teacher-shell.tsx",
  ],
  [
    "src/features/lms/components/assign-homework-desktop-view.tsx",
    "src/features/lms/components/assign-homework-page.tsx",
  ],
  [
    "src/features/lms/components/assign-homework-mobile-view.tsx",
    "src/features/lms/components/assign-homework-page.tsx",
  ],
  [
    "src/features/lms/components/assign-homework-parts.tsx",
    "src/features/lms/components/assign-homework-page.tsx",
  ],
  [
    "src/features/lms/components/exercise-bank/desktop-exercise-bank-view.tsx",
    "src/features/lms/components/exercise-bank-page.tsx",
  ],
  [
    "src/features/lms/components/exercise-bank/mobile-exercise-bank-view.tsx",
    "src/features/lms/components/exercise-bank-page.tsx",
  ],
  [
    "src/features/lcms/admin-operations/components/learning-resource-authoring-catalog-screens.tsx",
    "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx",
  ],
  [
    "src/features/lcms/admin-operations/components/learning-resource-authoring-upload-screen.tsx",
    "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx",
  ],
  ...[
    "admin-operations-overview.tsx",
    "admin-operations-center-management.tsx",
    "admin-operations-education-editor.tsx",
    "admin-operations-insight.tsx",
    "admin-operations-support.tsx",
  ].map((file) => [
    `src/features/lcms/admin-operations/components/${file}`,
    "src/features/lcms/admin-operations/components/admin-operations-workspace.tsx",
  ]),
  ...[
    "learning-resource-authoring-create-dialog-fields.tsx",
    "learning-resource-authoring-create-dialog-model.tsx",
    "learning-resource-authoring-create-dialog-presentation.tsx",
    "learning-resource-authoring-create-dialog-view.tsx",
  ].map((file) => [
    `src/features/lcms/admin-operations/components/${file}`,
    "src/features/lcms/admin-operations/components/learning-resource-authoring-create-dialog.tsx",
  ]),
  ...[
    "learning-resource-curriculum-explorer-badges.tsx",
    "learning-resource-curriculum-explorer-folder-canvas.tsx",
    "learning-resource-curriculum-explorer-grid.tsx",
    "learning-resource-curriculum-explorer-inspector.tsx",
    "learning-resource-curriculum-explorer-lanes.tsx",
    "learning-resource-curriculum-explorer-list.tsx",
    "learning-resource-curriculum-explorer-model.tsx",
    "learning-resource-curriculum-explorer-top-bar.tsx",
    "learning-resource-curriculum-explorer-tree.tsx",
  ].map((file) => [
    `src/features/lcms/admin-operations/components/${file}`,
    "src/features/lcms/admin-operations/components/learning-resource-curriculum-explorer.tsx",
  ]),
  ...[
    "quiz-editor-slide-intro-preview.tsx",
    "quiz-editor-slide-choice-preview.tsx",
    "quiz-editor-slide-drag-drop-preview.tsx",
    "quiz-editor-slide-feedback-preview.tsx",
    "quiz-editor-slide-media.tsx",
    "quiz-editor-slide-layout.tsx",
  ].map((file) => [
    `src/features/lcms/quiz/quiz-editor/components/${file}`,
    "src/features/lcms/quiz/quiz-editor/components/quiz-editor-slide-render.tsx",
  ]),
  ...[
    "question-bank-workspace-shell.tsx",
    "question-bank-compact-header.tsx",
    "question-bank-structure-panel.tsx",
    "question-bank-primitives.tsx",
    "question-library.tsx",
    "question-form-dialog.tsx",
    "quiz-builder-panel.tsx",
    "quiz-bank-panel.tsx",
  ].map((file) => [
    `src/features/lcms/quiz/question-bank/components/${file}`,
    "src/features/lcms/quiz/question-bank/components/question-bank-workspace.tsx",
  ]),
  ...[
    "user-access-control-section-config.tsx",
    "user-access-control-member-sections.tsx",
    "user-access-control-role-section.tsx",
    "user-access-control-access-section.tsx",
    "user-access-control-section-primitives.tsx",
  ].map((file) => [
    `src/features/lcms/admin-operations/components/${file}`,
    "src/features/lcms/admin-operations/components/user-access-control-sections.tsx",
  ]),
  ...[
    "seo-crm-workspace-shared.tsx",
    "seo-crm-overview.tsx",
    "seo-crm-pipeline.tsx",
    "seo-crm-pnl-workspace.tsx",
    "seo-crm-followup-handover.tsx",
  ].map((file) => [
    `src/features/crm/seo/components/${file}`,
    "src/features/crm/seo/components/seo-crm-workspace.tsx",
  ]),
]);
const LEARNING_RESOURCE_FIELDS_PATH =
  "src/features/lcms/admin-operations/components/learning-resource-authoring-fields.tsx";
const LEARNING_RESOURCE_WORKSPACE_PATH =
  "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx";
const LEGACY_RULE_OWNERS = new Map(
  [
    "tailwind-utility:gap-1.5",
    "tailwind-utility:pt-5",
    "tailwind-utility:px-6",
    "tailwind-utility:text-[var(--foreground)]",
    "tailwind-utility:text-[var(--muted-foreground)]",
    "tailwind-utility:text-base",
  ].map((rule) => [`${LEARNING_RESOURCE_FIELDS_PATH}|${rule}`, LEARNING_RESOURCE_WORKSPACE_PATH]),
);

// A violation's key is file|rule with no line number, so migrating or moving existing legacy code
// does not churn the baseline; only a NEW (file, rule) pair fails the ratchet.
export function violationKey(violation) {
  const displayPath = relative(process.cwd(), violation.file) || violation.file;
  const normalizedPath = displayPath.replace(/\\/g, "/");
  const legacyOwner =
    LEGACY_RULE_OWNERS.get(`${normalizedPath}|${violation.rule}`) ??
    LEGACY_FILE_OWNERS.get(normalizedPath) ??
    normalizedPath;
  return `${legacyOwner}|${violation.rule}`;
}

export function baselineKeys(paths) {
  return [...new Set(scanLegacyUi(paths).map(violationKey))].sort();
}

// Violations whose file|rule key is not in the frozen baseline set — the ratchet's core decision.
export function newViolations(violations, frozenKeys) {
  const frozen = new Set(frozenKeys);
  return violations.filter((violation) => !frozen.has(violationKey(violation)));
}

function runCli() {
  const args = process.argv.slice(2);
  const updateBaseline = args.includes("--update-baseline");
  const useBaseline = updateBaseline || args.includes("--baseline");
  const scopes = args.filter((arg) => !arg.startsWith("--"));
  const paths = scopes.length > 0 ? scopes : DEFAULT_SCAN_PATHS;

  if (updateBaseline) {
    writeFileSync(DEFAULT_BASELINE_PATH, `${JSON.stringify(baselineKeys(paths), null, 2)}\n`);
    console.log(`Wrote ${DEFAULT_BASELINE_PATH}`);
    return;
  }

  const violations = scanLegacyUi(paths);

  // Ratchet mode: allow the frozen baseline of pre-existing violations, fail only on NEW (file, rule)
  // pairs so no new legacy import / Tailwind utility slips in while the migration proceeds separately.
  if (useBaseline) {
    const frozenKeys = existsSync(DEFAULT_BASELINE_PATH)
      ? JSON.parse(readFileSync(DEFAULT_BASELINE_PATH, "utf8"))
      : [];
    const fresh = newViolations(violations, frozenKeys);
    if (fresh.length === 0) {
      console.log(`Legacy UI baseline holds (${frozenKeys.length} allowed, 0 new).`);
      return;
    }
    for (const violation of fresh) {
      const displayPath = relative(process.cwd(), violation.file) || violation.file;
      console.error(`${displayPath}:${violation.line}: ${violation.rule}: ${violation.excerpt}`);
    }
    console.error(`Legacy UI baseline failed with ${fresh.length} NEW violation(s) outside the allowlist.`);
    process.exitCode = 1;
    return;
  }

  if (violations.length === 0) {
    console.log("Legacy UI policy passed");
    return;
  }

  for (const violation of violations) {
    const displayPath = relative(process.cwd(), violation.file) || violation.file;
    console.error(`${displayPath}:${violation.line}: ${violation.rule}: ${violation.excerpt}`);
  }
  console.error(`Legacy UI policy failed with ${violations.length} violation(s).`);
  process.exitCode = 1;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  runCli();
}
