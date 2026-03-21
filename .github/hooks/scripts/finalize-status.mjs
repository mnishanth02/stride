import {
  clearCurrentSession,
  createHistoryEntry,
  deriveSessionSummary,
  ensureTrackingFiles,
  inferCategory,
  inferFeature,
  loadCurrentSession,
  loadHistory,
  readHookInput,
  saveHistory,
  shouldLogSession,
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
const { outcome, summary, allUserPrompts } = await deriveSessionSummary({
  currentSession,
  transcriptPath:
    input.transcript_path || currentSession.transcriptPath || null,
})

if (!shouldLogSession({ currentSession, allUserPrompts })) {
  await clearCurrentSession()
  await writeActivityLog({ currentSession: null, history })
  toJsonResult({})
  process.exit(0)
}

const touchedFiles = currentSession.touchedFiles || []
const category = inferCategory({ allUserPrompts, touchedFiles })
const feature = await inferFeature({ allUserPrompts, touchedFiles })

const nextHistory = [
  createHistoryEntry({
    currentSession,
    summary,
    outcome,
    category,
    feature,
    endedAt,
  }),
  ...history,
].slice(0, 100)

await saveHistory(nextHistory)
await clearCurrentSession()
await writeActivityLog({ currentSession: null, history: nextHistory })

toJsonResult({})
