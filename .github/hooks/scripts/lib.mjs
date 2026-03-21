import { promises as fs } from "node:fs"
import path from "node:path"
import process from "node:process"

export const ROOT_DIR = process.cwd()
export const CACHE_DIR = path.join(ROOT_DIR, ".turbo", "copilot-status")
export const CURRENT_SESSION_PATH = path.join(CACHE_DIR, "current-session.json")
export const HISTORY_PATH = path.join(CACHE_DIR, "history.json")
export const LOG_PATH = path.join(ROOT_DIR, "AI_ACTIVITY_LOG.md")

const TRACKED_TOOL_NAMES = new Set([
  "applypatch",
  "createfile",
  "editfiles",
  "editnotebookfile",
  "replacestringinfile",
  "writefile",
])

const IGNORED_PATH_PREFIXES = [
  ".next/",
  ".turbo/",
  "build/",
  "coverage/",
  "dist/",
  "node_modules/",
  "out/",
]

const IGNORED_PATHS = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
])

export async function readHookInput() {
  let raw = ""

  for await (const chunk of process.stdin) {
    raw += chunk
  }

  if (!raw.trim()) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function ensureTrackingFiles() {
  await fs.mkdir(CACHE_DIR, { recursive: true })

  const history = await readJson(HISTORY_PATH, [])
  await ensureLogFile(history)

  return history
}

export async function loadCurrentSession() {
  return readJson(CURRENT_SESSION_PATH, null)
}

export async function saveCurrentSession(session) {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  await fs.writeFile(
    CURRENT_SESSION_PATH,
    JSON.stringify(session, null, 2),
    "utf8"
  )
}

export async function clearCurrentSession() {
  try {
    await fs.unlink(CURRENT_SESSION_PATH)
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error
    }
  }
}

export async function loadHistory() {
  return readJson(HISTORY_PATH, [])
}

export async function saveHistory(history) {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), "utf8")
}

export async function writeActivityLog({ currentSession, history }) {
  const content = renderActivityLog({ currentSession, history })
  await fs.writeFile(LOG_PATH, content, "utf8")
}

export function extractTrackedPaths(toolName, toolInput) {
  const normalizedToolName = normalizeToolName(toolName)

  if (!TRACKED_TOOL_NAMES.has(normalizedToolName)) {
    return []
  }

  const matches = new Set()

  visitToolInput(toolInput, matches)

  return [...matches]
}

export async function deriveSessionSummary({ currentSession, transcriptPath }) {
  const transcriptText = await readTranscriptText(transcriptPath)
  const latestUserPrompt = extractLatestUserPrompt(transcriptText)
  const touchedFiles = Array.isArray(currentSession?.touchedFiles)
    ? currentSession.touchedFiles
    : []
  const touchedAreas = summarizeTouchedAreas(touchedFiles)
  const usefulPrompt = normalizePrompt(latestUserPrompt)

  if (touchedFiles.length === 0) {
    return {
      outcome: usefulPrompt?.toLowerCase().includes("plan")
        ? "📝 Planning"
        : "📝 Research",
      summary:
        usefulPrompt ||
        "Research or planning session with no tracked file changes",
    }
  }

  if (usefulPrompt) {
    return {
      outcome: "✅ Updated",
      summary: usefulPrompt,
    }
  }

  return {
    outcome: "✅ Updated",
    summary: `Updated ${touchedAreas}`,
  }
}

export function createHistoryEntry({
  currentSession,
  summary,
  outcome,
  endedAt,
}) {
  const files = Array.isArray(currentSession?.touchedFiles)
    ? currentSession.touchedFiles
    : []

  return {
    sessionId: currentSession?.sessionId || `session-${Date.now()}`,
    startedAt: currentSession?.startedAt || endedAt,
    endedAt,
    outcome,
    summary,
    files,
  }
}

export function toJsonResult(result = {}) {
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

async function ensureLogFile(history) {
  try {
    await fs.access(LOG_PATH)
  } catch {
    await fs.writeFile(
      LOG_PATH,
      renderActivityLog({
        currentSession: null,
        history,
      }),
      "utf8"
    )
  }
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallbackValue
    }

    return fallbackValue
  }
}

function visitToolInput(value, matches, keyName = "") {
  if (typeof value === "string") {
    for (const candidate of extractPathsFromString(value, keyName)) {
      const normalized = normalizeProjectPath(candidate)

      if (normalized && shouldTrackPath(normalized)) {
        matches.add(normalized)
      }
    }

    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      visitToolInput(item, matches, keyName)
    }

    return
  }

  if (!value || typeof value !== "object") {
    return
  }

  for (const [entryKey, entryValue] of Object.entries(value)) {
    visitToolInput(entryValue, matches, entryKey)
  }
}

function extractPathsFromString(value, keyName) {
  const candidates = []
  const normalizedKey = keyName.toLowerCase()

  if (
    normalizedKey.includes("file") ||
    normalizedKey.includes("path") ||
    normalizedKey.includes("uri")
  ) {
    candidates.push(value)
  }

  if (
    value.includes("*** Update File:") ||
    value.includes("*** Add File:") ||
    value.includes("*** Delete File:")
  ) {
    for (const match of value.matchAll(
      /^\*\*\* (?:Update|Add|Delete) File:\s+(.+?)(?:\s+->.*)?$/gm
    )) {
      candidates.push(match[1])
    }
  }

  if (/^(file:\/\/|\.\.?\/|\/|[A-Za-z]:\\)/.test(value)) {
    candidates.push(value)
  }

  return candidates
}

function normalizeProjectPath(inputPath) {
  if (!inputPath || typeof inputPath !== "string") {
    return null
  }

  if (/^https?:\/\//i.test(inputPath)) {
    return null
  }

  let candidate = inputPath.trim()

  if (!candidate) {
    return null
  }

  if (candidate.startsWith("file://")) {
    try {
      candidate = new URL(candidate).pathname
    } catch {
      return null
    }
  }

  const resolvedPath = path.isAbsolute(candidate)
    ? path.normalize(candidate)
    : path.resolve(ROOT_DIR, candidate)
  const relativePath = path
    .relative(ROOT_DIR, resolvedPath)
    .replaceAll(path.sep, "/")

  if (
    !relativePath ||
    relativePath.startsWith("../") ||
    relativePath === ".."
  ) {
    return null
  }

  return relativePath
}

function shouldTrackPath(relativePath) {
  if (IGNORED_PATHS.has(relativePath)) {
    return false
  }

  return !IGNORED_PATH_PREFIXES.some((prefix) =>
    relativePath.startsWith(prefix)
  )
}

function normalizeToolName(toolName) {
  return String(toolName || "")
    .toLowerCase()
    .replaceAll(/[^a-z]/g, "")
}

function renderActivityLog({ currentSession, history }) {
  const lastUpdated = new Date().toISOString()
  const sessionSection = currentSession
    ? renderCurrentSession(currentSession)
    : [
        "- **Status:** Idle",
        "- **Session ID:** —",
        "- **Started:** —",
        "- **Touched files:** None",
      ].join("\n")

  return [
    "# AI Activity Log",
    "",
    "This file is automatically maintained by workspace GitHub Copilot hooks. It tracks high-signal AI-assisted progress for this repository rather than every prompt or tool call.",
    "",
    `- **Last updated:** ${lastUpdated}`,
    "- **Tracking mode:** Feature and milestone progress",
    "- **Hook config:** `.github/hooks/project-status.json`",
    "",
    "## Current Session",
    "",
    sessionSection,
    "",
    "## Feature Progress History",
    "",
    renderHistory(history),
    "",
  ].join("\n")
}

function renderCurrentSession(currentSession) {
  const touchedFiles = Array.isArray(currentSession.touchedFiles)
    ? currentSession.touchedFiles
    : []
  const touchedFilesSection = touchedFiles.length
    ? touchedFiles.map((filePath) => `  - \`${filePath}\``).join("\n")
    : "  - None yet"

  return [
    `- **Status:** ${currentSession.status || "In progress"}`,
    `- **Session ID:** ${currentSession.sessionId || "Unknown"}`,
    `- **Started:** ${currentSession.startedAt || "Unknown"}`,
    `- **Focus:** ${currentSession.focus || "Awaiting task details"}`,
    "- **Touched files:**",
    touchedFilesSection,
  ].join("\n")
}

function renderHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No completed AI-assisted updates recorded yet."
  }

  const rows = history.map((entry) => {
    const endedAt = escapeTableText(formatShortDate(entry.endedAt))
    const outcome = escapeTableText(entry.outcome || "📝 Research")
    const summary = escapeTableText(entry.summary || "AI-assisted session")
    const files = escapeTableText(formatFileList(entry.files || []))

    return `| ${endedAt} | ${outcome} | ${summary} | ${files} |`
  })

  return [
    "| Date | Outcome | Summary | Files |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n")
}

function formatShortDate(value) {
  if (!value) {
    return "Unknown"
  }

  return String(value).replace("T", " ").replace(".000Z", " UTC")
}

function formatFileList(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return "No tracked files"
  }

  const limited = files.slice(0, 4).map((filePath) => `\`${filePath}\``)

  if (files.length > 4) {
    limited.push(`+${files.length - 4} more`)
  }

  return limited.join(", ")
}

function summarizeTouchedAreas(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return "project files"
  }

  const topLevelAreas = [
    ...new Set(files.map((filePath) => filePath.split("/")[0] || filePath)),
  ]

  if (topLevelAreas.length === 1) {
    return `files in ${topLevelAreas[0]}`
  }

  if (topLevelAreas.length === 2) {
    return `files in ${topLevelAreas[0]} and ${topLevelAreas[1]}`
  }

  return `files across ${topLevelAreas.slice(0, 3).join(", ")}${topLevelAreas.length > 3 ? ", and more" : ""}`
}

async function readTranscriptText(transcriptPath) {
  const normalizedPath = normalizeProjectPath(transcriptPath || "")
  const absolutePath = transcriptPath
    ? path.isAbsolute(transcriptPath)
      ? transcriptPath
      : normalizedPath
        ? path.join(ROOT_DIR, normalizedPath)
        : null
    : null

  if (!absolutePath) {
    return ""
  }

  try {
    return await fs.readFile(absolutePath, "utf8")
  } catch {
    return ""
  }
}

function extractLatestUserPrompt(transcriptText) {
  if (!transcriptText) {
    return ""
  }

  try {
    const parsed = JSON.parse(transcriptText)
    const messages = []

    collectMessages(parsed, messages)

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user" && messages[index].text.trim()) {
        return messages[index].text.trim()
      }
    }
  } catch {
    const textMatches = [
      ...transcriptText.matchAll(/"prompt"\s*:\s*"([^"]+)"/g),
    ].map((match) => match[1])

    if (textMatches.length > 0) {
      return textMatches[textMatches.length - 1]
    }
  }

  return ""
}

function collectMessages(node, messages) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectMessages(item, messages)
    }

    return
  }

  if (!node || typeof node !== "object") {
    return
  }

  const role = typeof node.role === "string" ? node.role.toLowerCase() : ""
  const text = extractText(
    node.content ?? node.text ?? node.prompt ?? node.message
  )

  if (role && text.trim()) {
    messages.push({ role, text: text.trim() })
  }

  for (const value of Object.values(node)) {
    collectMessages(value, messages)
  }
}

function extractText(value) {
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => extractText(entry))
      .filter(Boolean)
      .join(" ")
  }

  if (!value || typeof value !== "object") {
    return ""
  }

  for (const key of ["text", "content", "value", "prompt", "message", "body"]) {
    if (typeof value[key] === "string") {
      return value[key]
    }
  }

  return Object.values(value)
    .map((entry) => extractText(entry))
    .filter(Boolean)
    .join(" ")
}

function normalizePrompt(prompt) {
  const cleaned = String(prompt || "")
    .replaceAll(/\s+/g, " ")
    .trim()

  if (!cleaned) {
    return ""
  }

  if (
    /^(start implementation|continue|go ahead|do it|implement|fix it)$/i.test(
      cleaned
    )
  ) {
    return ""
  }

  if (cleaned.length > 140) {
    return `${cleaned.slice(0, 137)}...`
  }

  return cleaned
}

function escapeTableText(value) {
  return String(value || "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
}
