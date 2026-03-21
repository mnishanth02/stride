import {
  ensureTrackingFiles,
  extractTrackedPaths,
  loadCurrentSession,
  loadHistory,
  readHookInput,
  saveCurrentSession,
  toJsonResult,
  writeActivityLog,
} from "./lib.mjs"

const input = await readHookInput()
await ensureTrackingFiles()

const currentSession = (await loadCurrentSession()) || {
  sessionId: input.sessionId || `session-${Date.now()}`,
  startedAt: input.timestamp || new Date().toISOString(),
  status: "In progress",
  focus: "Active implementation session",
  touchedFiles: [],
  firstPrompt: null,
  transcriptPath: input.transcript_path || null,
  lastUpdated: input.timestamp || new Date().toISOString(),
}

const trackedPaths = extractTrackedPaths(input.tool_name, input.tool_input)

if (trackedPaths.length > 0) {
  currentSession.touchedFiles = [
    ...new Set([...(currentSession.touchedFiles || []), ...trackedPaths]),
  ]
  currentSession.focus = `Working in ${currentSession.touchedFiles[0]}`
}

if (!currentSession.firstPrompt && input.user_prompt) {
  currentSession.firstPrompt = String(input.user_prompt).slice(0, 500)
}

currentSession.transcriptPath =
  input.transcript_path || currentSession.transcriptPath || null
currentSession.lastUpdated = input.timestamp || new Date().toISOString()

await saveCurrentSession(currentSession)

const history = await loadHistory()
await writeActivityLog({ currentSession, history })

toJsonResult({})
