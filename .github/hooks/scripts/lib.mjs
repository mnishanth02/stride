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

const CATEGORY_PATTERNS = [
  {
    category: "Bug Fix",
    pattern:
      /\b(fix(es|ed|ing)?|bug(s)?|defect|broken|crash(es|ed|ing)?|patch|hotfix|regression|debug(ging)?)\b/i,
  },
  {
    category: "Refactor",
    pattern:
      /\b(refactor(ed|ing)?|restructur(e|ed|ing)|clean\s*up|reorganiz(e|ed|ing)|simplif(y|ied|ying))\b/i,
  },
  {
    category: "Design/Architecture",
    pattern:
      /\b(design\s+(system|decision|pattern|document)|architecture|adr|rfc|specification|proposal|tech\s+debt)\b/i,
  },
  {
    category: "Infrastructure",
    pattern:
      /\b(ci\/cd|pipeline|deploy(ment)?|docker|monorepo|workspace\s+setup|eslint|biome|prettier|tooling|drizzle\s+config)\b/i,
  },
]

const INFRA_PATH_PATTERNS = [
  /^\.github\//,
  /^\.husky\//,
  /biome\.json$/,
  /tsconfig.*\.json$/,
  /turbo\.json$/,
  /drizzle\.config/,
  /package\.json$/,
  /postcss/,
  /next\.config/,
]

const DESIGN_PATH_PATTERNS = [/^docs\/impl-plan\//, /^docs\/core-plan\//]

const DIRECTORY_LABELS = {
  "apps/web": "Web App",
  "packages/database": "Database",
  "packages/ui": "Shared UI",
  "packages/storage": "Storage",
  "packages/typescript-config": "TypeScript Config",
  ".github": "CI/CD & Hooks",
  docs: "Documentation",
}

const TRIVIAL_PROMPTS =
  /^(start implementation|continue|go ahead|do it|implement|fix it|yes|no|ok|okay|sure|thanks|thank you|looks good|lgtm|proceed|next|done)$/i

const DECISION_PATTERN =
  /\b(decided to|chose|switched to|went with|picked|selected|opted for|settled on)\b[^.!?\n]*/i

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

export function shouldLogSession({ currentSession, allUserPrompts }) {
  const touchedFiles = Array.isArray(currentSession?.touchedFiles)
    ? currentSession.touchedFiles
    : []

  if (touchedFiles.length > 0) {
    return true
  }

  const startedAt = currentSession?.startedAt
    ? new Date(currentSession.startedAt)
    : null
  const now = new Date()

  if (startedAt && now - startedAt < 60_000) {
    return false
  }

  const totalWords = allUserPrompts
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length

  if (totalWords > 100) {
    return true
  }

  if (totalWords < 20) {
    return false
  }

  return true
}

export function inferCategory({ allUserPrompts, touchedFiles }) {
  const combinedText = allUserPrompts.join(" ")
  const files = Array.isArray(touchedFiles) ? touchedFiles : []

  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(combinedText)) {
      return category
    }
  }

  if (files.length > 0) {
    if (files.every((f) => INFRA_PATH_PATTERNS.some((p) => p.test(f)))) {
      return "Infrastructure"
    }

    if (files.every((f) => DESIGN_PATH_PATTERNS.some((p) => p.test(f)))) {
      return "Design/Architecture"
    }
  }

  return files.length > 0 ? "Feature" : "Design/Architecture"
}

export async function inferFeature({ allUserPrompts, touchedFiles }) {
  const files = Array.isArray(touchedFiles) ? touchedFiles : []
  const combinedText = allUserPrompts.join(" ").toLowerCase()

  const implPlanFiles = files.filter((f) => f.startsWith("docs/impl-plan/"))

  if (implPlanFiles.length > 0) {
    const featureName = await readImplPlanTitle(implPlanFiles[0])

    if (featureName) {
      return featureName
    }
  }

  try {
    const implPlanDir = path.join(ROOT_DIR, "docs", "impl-plan")
    const implFiles = await fs.readdir(implPlanDir)

    for (const file of implFiles) {
      if (!file.endsWith(".md") || file === "vercel-env-vars.md") {
        continue
      }

      const slug = file.replace(/\.md$/, "").replace(/-\d+$/, "")
      const words = slug.split("-").filter((w) => w.length > 2)

      if (words.length >= 2 && words.every((w) => combinedText.includes(w))) {
        const title = await readImplPlanTitle(path.join("docs/impl-plan", file))

        if (title) {
          return title
        }
      }
    }
  } catch {
    // no impl-plan directory
  }

  if (files.length > 0) {
    const labels = new Set()

    for (const file of files) {
      for (const [prefix, label] of Object.entries(DIRECTORY_LABELS)) {
        if (file.startsWith(prefix)) {
          labels.add(label)
          break
        }
      }
    }

    if (labels.size > 0) {
      return [...labels].join(" & ")
    }
  }

  return "General"
}

export async function deriveSessionSummary({ currentSession, transcriptPath }) {
  const transcriptText = await readTranscriptText(transcriptPath)
  const allUserPrompts = extractAllUserPrompts(
    transcriptText,
    currentSession?.firstPrompt
  )
  const touchedFiles = Array.isArray(currentSession?.touchedFiles)
    ? currentSession.touchedFiles
    : []
  const touchedAreas = summarizeTouchedAreas(touchedFiles)

  const parts = []

  const intentPrompt = findFirstSubstantivePrompt(allUserPrompts)

  if (intentPrompt) {
    parts.push(intentPrompt)
  }

  if (touchedFiles.length > 0) {
    parts.push(`Modified ${touchedAreas}.`)
  }

  const decision = extractDecision(allUserPrompts)

  if (decision) {
    parts.push(decision)
  }

  const summary = parts.join(" ").trim()

  if (!summary) {
    return {
      outcome: touchedFiles.length > 0 ? "✅ Updated" : "📝 Research",
      summary:
        touchedFiles.length > 0
          ? `Updated ${touchedAreas}`
          : "Research or planning session",
      allUserPrompts,
    }
  }

  const capped = summary.length > 400 ? `${summary.slice(0, 397)}...` : summary

  return {
    outcome: touchedFiles.length > 0 ? "✅ Updated" : "📝 Research",
    summary: capped,
    allUserPrompts,
  }
}

export function createHistoryEntry({
  currentSession,
  summary,
  outcome,
  category,
  feature,
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
    category: category || "Feature",
    feature: feature || "General",
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
    "This file is automatically maintained by workspace GitHub Copilot hooks. It captures meaningful AI-assisted progress — features, bug fixes, refactors, infrastructure changes, and design decisions — rather than every prompt or tool call.",
    "",
    `- **Last updated:** ${lastUpdated}`,
    "- **Tracking mode:** Smart filtering (only significant sessions are logged)",
    "- **Hook config:** `.github/hooks/project-status.json`",
    "",
    "## Current Session",
    "",
    sessionSection,
    "",
    "## Feature Progress",
    "",
    renderGroupedHistory(history),
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

function renderGroupedHistory(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "No completed AI-assisted updates recorded yet."
  }

  const groups = new Map()

  for (const entry of history) {
    const feature = entry.feature || "General"

    if (!groups.has(feature)) {
      groups.set(feature, [])
    }

    groups.get(feature).push(entry)
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "General") {
      return 1
    }

    if (b === "General") {
      return -1
    }

    const aLatest = groups.get(a)[0]?.endedAt || ""
    const bLatest = groups.get(b)[0]?.endedAt || ""

    return bLatest.localeCompare(aLatest)
  })

  const sections = []

  for (const feature of sortedKeys) {
    const entries = groups.get(feature)
    const latestDate = formatDateOnly(entries[0]?.endedAt)
    const sessionCount = entries.length
    const sessionWord = sessionCount === 1 ? "session" : "sessions"

    sections.push(`### ${feature}`)
    sections.push(
      `> ${sessionCount} ${sessionWord} · Last updated: ${latestDate}`
    )
    sections.push("")

    for (const entry of entries) {
      const date = formatDateOnly(entry.endedAt)
      const category = entry.category || "Uncategorized"
      const summary = (entry.summary || "AI-assisted session")
        .replaceAll("\\n", " ")
        .replaceAll(/\s+/g, " ")
      const files = formatFileList(entry.files || [])

      sections.push(`- **${date}** [${category}] ${summary}`)
      sections.push(`  — ${files}`)
      sections.push("")
    }
  }

  return sections.join("\n")
}

function formatDateOnly(value) {
  if (!value) {
    return "Unknown"
  }

  return String(value).slice(0, 10)
}

function formatFileList(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return "No file changes"
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

function extractAllUserPrompts(transcriptText, firstPromptFallback) {
  const prompts = []

  if (transcriptText) {
    try {
      const parsed = JSON.parse(transcriptText)
      const messages = []

      collectMessages(parsed, messages)

      for (const msg of messages) {
        if (msg.role === "user" && msg.text.trim()) {
          const cleaned = normalizePromptText(msg.text.trim())

          if (cleaned) {
            prompts.push(cleaned)
          }
        }
      }
    } catch {
      const textMatches = [
        ...transcriptText.matchAll(/"prompt"\s*:\s*"([^"]+)"/g),
      ].map((m) => m[1])

      for (const match of textMatches) {
        const cleaned = normalizePromptText(match)

        if (cleaned) {
          prompts.push(cleaned)
        }
      }
    }
  }

  if (prompts.length === 0 && firstPromptFallback) {
    const cleaned = normalizePromptText(firstPromptFallback)

    if (cleaned) {
      prompts.push(cleaned)
    }
  }

  return prompts
}

function findFirstSubstantivePrompt(prompts) {
  for (const prompt of prompts) {
    if (TRIVIAL_PROMPTS.test(prompt)) {
      continue
    }

    if (prompt.split(/\s+/).length < 3) {
      continue
    }

    return prompt.length > 200 ? `${prompt.slice(0, 197)}...` : prompt
  }

  return ""
}

function extractDecision(prompts) {
  for (const prompt of prompts) {
    const match = prompt.match(DECISION_PATTERN)

    if (match) {
      const beforeMatch = prompt.lastIndexOf(".", match.index - 1) + 1
      const afterMatch = prompt.indexOf(".", match.index + match[0].length)
      const sentence = prompt
        .slice(beforeMatch, afterMatch > -1 ? afterMatch + 1 : undefined)
        .trim()

      if (sentence.length > 150) {
        return `${sentence.slice(0, 147)}...`
      }

      return sentence
    }
  }

  return ""
}

async function readImplPlanTitle(relativePath) {
  try {
    const fullPath = path.join(ROOT_DIR, relativePath)
    const content = await fs.readFile(fullPath, "utf8")
    const match = content.match(/^#\s+(.+)/m)

    if (match) {
      return match[1]
        .trim()
        .replace(/^Module \d+[.:]\s*/i, "")
        .replace(/^Feature[.:]\s*/i, "")
    }
  } catch {
    // file not readable
  }

  return null
}

function normalizePromptText(prompt) {
  return String(prompt || "")
    .replaceAll(/\s+/g, " ")
    .trim()
}
