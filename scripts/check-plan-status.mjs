import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const STATUS_PATTERN = /^> Status: (active|completed|superseded) — (.+)$/u;
const STATUS_PREFIX = /^> Status:/u;
const TASK_ID_PATTERN = /erg-(\d{3})/iu;
const MARKDOWN_TARGET_PATTERN = /(?:^|[\s`])(\S+\.md)(?:[`.\s]|$)/u;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function markdownFiles(directory) {
  if (!(await exists(directory))) return [];
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
    .map((entry) => join(directory, entry.name));
}

function relativePath(root, path) {
  return relative(root, path).replaceAll("\\", "/");
}

function supersededTarget(root, path, note) {
  const match = note.match(MARKDOWN_TARGET_PATTERN);
  if (!match) return null;
  const referencedPath = match[1].replaceAll("`", "");
  return referencedPath.includes("/")
    ? resolve(root, referencedPath)
    : resolve(dirname(path), referencedPath);
}

export async function auditPlanStatuses({ root }) {
  const files = [
    ...(await markdownFiles(join(root, "plans"))),
    ...(await markdownFiles(join(root, "specs"))),
  ].sort((left, right) => relativePath(root, left).localeCompare(relativePath(root, right)));
  const findings = [];

  for (const path of files) {
    const documentPath = relativePath(root, path);
    const lines = (await readFile(path, "utf8")).split(/\r?\n/u);
    const statusLines = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => STATUS_PREFIX.test(line));

    if (statusLines.length === 0) {
      findings.push({ code: "MISSING_STATUS", path: documentPath });
      continue;
    }
    if (statusLines.length > 1) {
      findings.push({ code: "DUPLICATE_STATUS", path: documentPath });
      continue;
    }

    const [{ line: statusLine, index: statusIndex }] = statusLines;
    const statusMatch = statusLine.match(STATUS_PATTERN);
    if (!statusMatch) {
      findings.push({ code: "INVALID_STATUS", path: documentPath });
      continue;
    }

    const titleIndex = lines.findIndex((line) => /^#\s+\S/u.test(line));
    const firstContentAfterTitle = lines.findIndex(
      (line, index) => index > titleIndex && line.trim() !== "",
    );
    if (titleIndex < 0 || firstContentAfterTitle !== statusIndex) {
      findings.push({ code: "MISPLACED_STATUS", path: documentPath });
      continue;
    }

    const [, state, note] = statusMatch;
    const taskMatch = documentPath.match(TASK_ID_PATTERN);
    if (taskMatch) {
      const taskId = `ERG-${taskMatch[1]}`;
      if (!note.toUpperCase().includes(taskId)) {
        findings.push({ code: "MISSING_TASK_REFERENCE", path: documentPath, taskId });
        continue;
      }
    }

    if (state === "superseded") {
      const target = supersededTarget(root, path, note);
      if (!target || !(await exists(target))) {
        findings.push({ code: "MISSING_SUPERSEDED_TARGET", path: documentPath });
      }
    }
  }

  return { ok: findings.length === 0, findings };
}

async function main() {
  const root = resolve(process.env.ERG_PLAN_DOCS_ROOT ?? "docs/superpowers");
  const result = await auditPlanStatuses({ root });
  if (!result.ok) {
    for (const finding of result.findings) {
      console.error(`${finding.code} ${finding.path}${finding.taskId ? ` (${finding.taskId})` : ""}`);
    }
    process.exitCode = 1;
    return;
  }
  console.log("Plan/spec status governance check passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
