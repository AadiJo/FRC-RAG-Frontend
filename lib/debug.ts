export function isDebugRagHttpEnabled(): boolean {
  const v = process.env.DEBUG_RAG_HTTP ?? process.env.DEBUG_LOGGING;
  return v === "1" || v === "true";
}

export function isDebugVerboseEnabled(): boolean {
  const v = process.env.DEBUG_VERBOSE;
  return v === "1" || v === "true";
}

export function shouldLog(): boolean {
  return isDebugRagHttpEnabled();
}
