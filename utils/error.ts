/**
 * Normalizes any caught value into a standard Error object.
 * Prevents "Uncaught [object Object]" errors by ensuring a valid message property exists.
 */
export function toError(e: unknown, fallbackMessage = "Unknown System Error"): Error {
  if (e instanceof Error) return e;
  
  if (typeof e === "string") return new Error(e);
  
  if (typeof e === "object" && e !== null) {
    // Handle Dexie errors or plain objects with message properties
    const obj = e as Record<string, any>;
    
    // Dexie often puts the actual reason in 'inner' or 'message'
    const message = obj.message || obj.reason || obj.name;
    if (typeof message === 'string') return new Error(message);
    
    try {
      // Avoid circular references when stringifying
      const str = JSON.stringify(e);
      return new Error(str === '{}' ? `${fallbackMessage} (Empty Object)` : str);
    } catch {
      return new Error(`${fallbackMessage}: [Circular or Complex Object]`);
    }
  }
  
  return new Error(`${fallbackMessage}: ${String(e)}`);
}

/**
 * Enhanced logging for diagnostic purposes
 */
export function logDiagnostic(title: string, error: unknown) {
  const normalized = toError(error);
  console.group(`ONYX DIAGNOSTIC: ${title}`);
  console.error(normalized.message);
  console.dir(error);
  console.groupEnd();
  return normalized;
}
