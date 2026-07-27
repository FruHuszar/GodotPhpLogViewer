const state = {
  logs: [],
  activeFilter: "ALL",
  searchTerm: "",
  audioEnabled: false,
  audioKeyword: "",
  lastSeenLogId: null,
  visibleColumns: {
    id: true,
    time: true,
    type: true,
    "script-path": true,
    message: true,
  },
};

export function setLogs(newLogs) {
  state.logs = newLogs;
}

export function getLogs() {
  return state.logs;
}

export function setActiveFilter(filter) {
  state.activeFilter = filter;
}

export function getActiveFilter() {
  return state.activeFilter;
}

export function setSearchTerm(term) {
  state.searchTerm = term.trim().toLowerCase();
}

export function getSearchTerm() {
  return state.searchTerm;
}

export function setAudioEnabled(enabled) {
  state.audioEnabled = enabled;
}

export function isAudioEnabled() {
  return state.audioEnabled;
}

export function setAudioKeyword(keyword) {
  state.audioKeyword = keyword.trim().toLowerCase();
}

export function getAudioKeyword() {
  return state.audioKeyword;
}

export function getLastSeenLogId() {
  return state.lastSeenLogId;
}

export function setLastSeenLogId(id) {
  state.lastSeenLogId = id;
}

export function setColumnVisible(columnName, isVisible) {
  if (columnName in state.visibleColumns) {
    state.visibleColumns[columnName] = isVisible;
  }
}

export function getVisibleColumns() {
  return state.visibleColumns;
}

export function getFilteredLogs() {
  return state.logs.filter((log) => {
    const matchesFilter =
      state.activeFilter === "ALL" || log.log_type === state.activeFilter;

    const message = (log.message || "").toLowerCase();
    const scriptPath = (log.script_path || "").toLowerCase();
    const matchesSearch =
      state.searchTerm === "" ||
      message.includes(state.searchTerm) ||
      scriptPath.includes(state.searchTerm);

    return matchesFilter && matchesSearch;
  });
}
