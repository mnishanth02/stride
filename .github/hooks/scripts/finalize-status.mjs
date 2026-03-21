import {
  clearCurrentSession,
  createHistoryEntry,
  deriveSessionSummary,
  ensureTrackingFiles,
  loadCurrentSession,
  loadHistory,
  readHookInput,
  saveHistory,
  toJsonResult,
  writeActivityLog,
} from "./lib.mjs"

const input = await readHookInput()
await ensureTrackingFiles()

const currentSession = await loadCurrentSession()
const history = await loadHistory()

if (!currentSession) {
  await writeActivityLog({ currentSession: null, history })
  toJsonResult({})
  process.exit(0)
}

const endedAt = input.timestamp || new Date().toISOString()
const { outcome, summary } = await deriveSessionSummary({
  currentSession,
  transcriptPath:
    input.transcript_path || currentSession.transcriptPath || null,
})

const nextHistory = [
  createHistoryEntry({
    currentSession,
    summary,
    outcome,
    endedAt,
  }),
  ...history,
].slice(0, 50)

await saveHistory(nextHistory)
await clearCurrentSession()
await writeActivityLog({ currentSession: null, history: nextHistory })

toJsonResult({})
