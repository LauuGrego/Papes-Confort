/**
 * Utility to fix and sanitize text strings fetched from GesCom database (stored in Latin-1 / CP1252),
 * resolving any double-encoded UTF-8 sequences or character replacements.
 */
export function cleanGescomText(text: string | number | null | undefined): string | undefined {
  if (text === null || text === undefined) return undefined;
  let str = String(text).trim();
  if (!str) return undefined;

  // Fix double-encoded UTF-8 sequences (e.g. "automÃ¡tico" -> "automático")
  if (/[\u00C2-\u00C5][\u0080-\u00BF]/.test(str)) {
    try {
      const fixed = Buffer.from(str, 'binary').toString('utf8');
      if (!fixed.includes('\uFFFD')) {
        str = fixed.trim();
      }
    } catch (_) {}
  }

  return str;
}
