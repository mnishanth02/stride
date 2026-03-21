import {
  ensureTrackingFiles,
  loadHistory,
  readHookInput,
  saveCurrentSession,
  toJsonResult,
  writeActivityLog,
} from "./lib.mjs"

const input = await readHookInput()
await ensureTrackingFiles()

const currentSession = {
  sessionId: input.sessionId || `session-${Date.now()}`,
  startedAt: input.timestamp || new Date().toISOString(),
  status: "In progress",
  focus: "Awaiting task details",
  touchedFiles: [],
  transcriptPath: input.transcript_path || null,
  lastUpdated: input.timestamp || new Date().toISOString(),
}

await saveCurrentSession(currentSession)

const history = await loadHistory()
await writeActivityLog({ currentSession, history })

toJsonResult({})
