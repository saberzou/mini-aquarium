// Preferences are optional: storage restrictions must never stop the pond.
export function readPreference(key, fallback) {
  try {
    const raw = localStorage.getItem(`aquarium-${key}`);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}
export function savePreference(key, value) {
  try { localStorage.setItem(`aquarium-${key}`, JSON.stringify(value)); } catch { /* Private or full storage. */ }
}
