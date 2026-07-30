import { state } from "../state.js";
import { ALERT_SOURCES, ALERT_COOLDOWN_MS } from "../config.js";

let alertSound = null;
let lastPlayedAt = 0;

export async function loadAlertSound() {
  if (alertSound) return true;

  for (const source of ALERT_SOURCES) {
    const response = await fetch(source, { method: "HEAD" }).catch(() => null);

    if (response?.ok) {
      alertSound = new Audio(source);
      return true;
    }
  }

  return false;
}

export function playAlertFor(arrivals) {
  if (!state.audioEnabled || !alertSound) return;
  if (!arrivals.some(shouldAlert)) return;
  if (Date.now() - lastPlayedAt < ALERT_COOLDOWN_MS) return;

  lastPlayedAt = Date.now();
  alertSound.currentTime = 0;
  alertSound.play().catch(() => {});
}

function shouldAlert(log) {
  if (!state.audioKeyword) return true;

  const haystack = `${log.message || ""} ${log.script_path || ""}`.toLowerCase();
  return haystack.includes(state.audioKeyword);
}
