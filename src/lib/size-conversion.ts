// Shared sneaker size conversion between US, UK, EUR, and CM scales.
// Supports men's sizing. Keys in each map are the *other* scale's label.

type ConvTable = { us: string; uk: string; eur: string; cm: string };

// Master table: each row is an equivalent size across all scales.
const TABLE: ConvTable[] = [
  { us: "6",    uk: "5.5", eur: "38.5", cm: "24" },
  { us: "6.5",  uk: "6",   eur: "39",   cm: "24.5" },
  { us: "7",    uk: "6",   eur: "40",   cm: "25" },
  { us: "7.5",  uk: "6.5", eur: "40.5", cm: "25.5" },
  { us: "8",    uk: "7",   eur: "41",   cm: "26" },
  { us: "8.5",  uk: "7.5", eur: "42",   cm: "26.5" },
  { us: "9",    uk: "8",   eur: "42.5", cm: "27" },
  { us: "9.5",  uk: "8.5", eur: "43",   cm: "27.5" },
  { us: "10",   uk: "9",   eur: "44",   cm: "28" },
  { us: "10.5", uk: "9.5", eur: "44.5", cm: "28.5" },
  { us: "11",   uk: "10",  eur: "45",   cm: "29" },
  { us: "11.5", uk: "10.5", eur: "46",  cm: "29.5" },
  { us: "12",   uk: "11",  eur: "46.5", cm: "30" },
  { us: "13",   uk: "12",  eur: "47.5", cm: "31" },
  { us: "14",   uk: "13",  eur: "48.5", cm: "32" },
];

// Build lookup maps: <"scale:label", equivalent row>
const LOOKUP: Record<string, ConvTable> = {};
for (const row of TABLE) {
  for (const scale of ["us", "uk", "eur", "cm"] as const) {
    LOOKUP[`${scale}:${row[scale]}`] = row;
  }
}

// Normalize a size label like "US 9", "EUR 42.5", "UK 8", "27 CM", "9", "42.5"
export function parseSizeLabel(label: string): { scale: "US" | "UK" | "EUR" | "CM"; value: string } | null {
  const s = label.trim();
  let m = s.match(/^(US|UK|EUR|EU|CM)\s*(.+)$/i);
  if (m) {
    let scale = m[1].toUpperCase();
    if (scale === "EU") scale = "EUR";
    return { scale: scale as "US" | "UK" | "EUR" | "CM", value: m[2].trim() };
  }
  // Bare number: CM sizes are typically 24-32, EUR 36-49, US/UK 4-15
  const n = parseFloat(s);
  if (!isNaN(n)) {
    if (n >= 36 && n <= 50) return { scale: "EUR", value: s };
    if (n >= 22 && n < 36) return { scale: "CM", value: s };
    if (n >= 4 && n < 22) return { scale: "US", value: s };
  }
  return null;
}

// Convert any size label to the target scale. Returns null if not convertible.
export function convertSize(label: string, target: "US" | "UK" | "EUR" | "CM"): string | null {
  const parsed = parseSizeLabel(label);
  if (!parsed) return null;
  if (parsed.scale === target) return parsed.value;
  const row = LOOKUP[`${parsed.scale.toLowerCase()}:${parsed.value}`];
  if (!row) return null;
  return row[target.toLowerCase() as "us" | "uk" | "eur" | "cm"];
}
