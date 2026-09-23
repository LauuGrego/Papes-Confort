/**
 * Utility to repair and sanitize corrupted Spanish characters, mojibake (e.g. \uFFFD)
 * and double-encoded UTF-8 strings coming from legacy ERP / GesCom databases.
 */
export function sanitizeCorruptedSpanishText(text: string | null | undefined): string {
  if (!text) return '';
  let str = String(text);

  // Fix double-encoded UTF-8 sequences (e.g. "automÃ¡tico" -> "automático")
  if (/[\u00C2-\u00C5][\u0080-\u00BF]/.test(str)) {
    try {
      if (typeof Buffer !== 'undefined') {
        const fixed = Buffer.from(str, 'binary').toString('utf8');
        if (!fixed.includes('\uFFFD')) {
          str = fixed;
        }
      }
    } catch (_) {}
  }

  // Common vocabulary replacements for \uFFFD (Unicode replacement character)
  const dictionary: [RegExp, string | ((match: string) => string)][] = [
    [/multitama[\uFFFD]os/gi, 'multitamaños'],
    [/tama[\uFFFD]o/gi, 'tamaño'],
    [/tama[\uFFFD]os/gi, 'tamaños'],
    [/bot[\uFFFD]n/gi, (m) => (m[0] === 'B' ? 'Botón' : 'botón')],
    [/caj[\uFFFD]n/gi, (m) => (m[0] === 'C' ? 'Cajón' : 'cajón')],
    [/m[\uFFFD]vil/gi, (m) => (m[0] === 'M' ? 'Móvil' : 'móvil')],
    [/[\uFFFD]ltima/gi, 'Última'],
    [/[\uFFFD]ltimo/gi, 'Último'],
    [/alambr[\uFFFD]n/gi, 'alambrón'],
    [/panor[\uFFFD]mico/gi, 'panorámico'],
    [/panor[\uFFFD]mica/gi, 'panorámica'],
    [/Disfrut[\uFFFD]/g, 'Disfrutá'],
    [/disfrut[\uFFFD]/g, 'disfrutá'],
    [/s[\uFFFD]mil/gi, (m) => (m[0] === 'S' ? 'Símil' : 'símil')],
    [/plum[\uFFFD]n/gi, (m) => (m[0] === 'P' ? 'Plumón' : 'plumón')],
    [/dise[\uFFFD]o/gi, (m) => (m[0] === 'D' ? 'Diseño' : 'diseño')],
    [/dise[\uFFFD]os/gi, (m) => (m[0] === 'D' ? 'Diseños' : 'diseños')],
    [/semiautom[\uFFFD]tico/gi, 'semiautomático'],
    [/semiautom[\uFFFD]tica/gi, 'semiautomática'],
    [/autom[\uFFFD]tico/gi, (m) => (m[0] === 'A' ? 'Automático' : 'automático')],
    [/autom[\uFFFD]tica/gi, (m) => (m[0] === 'A' ? 'Automática' : 'automática')],
    [/autom[\uFFFD]ticos/gi, 'automáticos'],
    [/autom[\uFFFD]ticas/gi, 'automáticas'],
    [/r[\uFFFD]pido/gi, (m) => (m[0] === 'R' ? 'Rápido' : 'rápido')],
    [/r[\uFFFD]pida/gi, (m) => (m[0] === 'R' ? 'Rápida' : 'rápida')],
    [/m[\uFFFD]dulo/gi, 'módulo'],
    [/m[\uFFFD]s\b/gi, 'más'],
    [/ll[\uFFFD]valo/gi, 'llévalo'],
    [/f[\uFFFD]sico/gi, 'físico'],
    [/f[\uFFFD]sica/gi, 'física'],
    [/tecnolog[\uFFFD]a/gi, (m) => (m[0] === 'T' ? 'Tecnología' : 'tecnología')],
    [/a[\uFFFD]o\b/gi, 'año'],
    [/a[\uFFFD]os\b/gi, 'años'],
    [/homog[\uFFFD]neo/gi, 'homogéneo'],
    [/homog[\uFFFD]neos/gi, 'homogéneos'],
    [/trasl[\uFFFD]cida/gi, 'traslúcida'],
    [/trasl[\uFFFD]cido/gi, 'traslúcido'],
    [/14[\uFFFD]/g, "14'"],
    [/([a-zA-Z])ci[\uFFFD]n\b/gi, '$1ción'],
    [/([a-zA-Z])si[\uFFFD]n\b/gi, '$1sión'],
  ];

  for (const [regex, replacement] of dictionary) {
    str = str.replace(regex, replacement as any);
  }

  return str;
}
