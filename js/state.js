import { RUNNING_WINDOW_MS } from "./config.js";

export const state = {
  logs: [],
  filter: "ALL",
  search: "",
  audioEnabled: false,
  audioKeyword: "",
  lastSeenId: null,
  lastArrivalAt: 0,
  renderedIds: "",
  columns: {
    id: true,
    time: true,
    type: true,
    "script-path": true,
    message: true,
  },
};

export function severity(log) {
  const type = String(log.log_type || "").toUpperCase();
  return ["ERROR", "WARNING", "INFO"].includes(type) ? type : "INFO";
}

export function filteredLogs() {
  return state.logs.filter((log) => matchesFilter(log) && matchesSearch(log));
}

export function counts() {
  const result = { ERROR: 0, WARNING: 0, INFO: 0 };
  state.logs.forEach((log) => (result[severity(log)] += 1));
  return result;
}

export function newArrivals(logs) {
  const known = state.lastSeenId;
  state.lastSeenId = logs.reduce((max, log) => Math.max(max, Number(log.id) || 0), 0);

  if (known === null) return [];

  const arrivals = logs.filter((log) => Number(log.id) > known);
  if (arrivals.length) state.lastArrivalAt = Date.now();

  return arrivals;
}

export function connectionStatus() {
  return Date.now() - state.lastArrivalAt < RUNNING_WINDOW_MS ? "running" : "listening";
}

function matchesFilter(log) {
  return state.filter === "ALL" || severity(log) === state.filter;
}

function matchesSearch(log) {
  if (!state.search) return true;

  const haystack = `${log.message || ""} ${log.script_path || ""}`.toLowerCase();
  return haystack.includes(state.search);
}
