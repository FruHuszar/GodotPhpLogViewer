const STATUS_LABELS = {
  running: "receiving logs",
  listening: "listening",
  offline: "no connection",
};

export function updateCounts(counts) {
  document.getElementById("countError").textContent = counts.ERROR;
  document.getElementById("countWarn").textContent = counts.WARNING;
  document.getElementById("countInfo").textContent = counts.INFO;
}

export function updateStatus(status) {
  document.getElementById("statusDot").dataset.status = status;
  document.getElementById("statusText").textContent = STATUS_LABELS[status];
}
