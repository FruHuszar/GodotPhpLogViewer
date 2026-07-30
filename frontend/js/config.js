export const API_BASE_URL = "http://localhost:8000/api/logs";

export const POLL_INTERVAL_MS = 1000;

export const MAX_ROWS = 500;

export const RUNNING_WINDOW_MS = 8000;

export const ALERT_SOURCES = ["audio/alert.wav", "audio/alert.mp3"];

export const ALERT_COOLDOWN_MS = 1500;

export function runningLocally() {
  const host = window.location.hostname;

  return (
    host === "" ||
    host === "localhost" ||
    host === "[::1]" ||
    host.startsWith("127.") ||
    host.startsWith("192.")
  );
}
