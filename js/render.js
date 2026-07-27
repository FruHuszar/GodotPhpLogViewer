import { getVisibleColumns } from "./state.js";

const rowsById = new Map();
let emptyRow = null;

export function renderTable(logs, onDeleteCallback) {
  const tbody = document.getElementById("logTableBody");
  if (!tbody) return;

  if (logs.length === 0) {
    clearRows();
    showEmptyState(tbody);
    return;
  }

  hideEmptyState();

  const seen = new Set();
  let previous = null;

  logs.forEach((log) => {
    const id = String(log.id);
    seen.add(id);

    let row = rowsById.get(id);

    if (!row) {
      row = buildRow(log, onDeleteCallback);
      rowsById.set(id, row);
    }

    const expected = previous ? previous.nextSibling : tbody.firstChild;

    if (row !== expected) {
      tbody.insertBefore(row, expected);
    }

    previous = row;
  });

  rowsById.forEach((row, id) => {
    if (!seen.has(id)) {
      row.remove();
      rowsById.delete(id);
    }
  });
}

function buildRow(log, onDeleteCallback) {
  const columns = getVisibleColumns();
  const tr = document.createElement("tr");

  const selectCell = document.createElement("td");
  const selectBox = document.createElement("input");
  selectBox.type = "checkbox";
  selectBox.className = "row-select";
  selectBox.dataset.id = String(log.id);
  selectBox.setAttribute("aria-label", `Select row ${log.id}`);
  selectCell.appendChild(selectBox);
  tr.appendChild(selectCell);

  tr.appendChild(cell("id", String(log.id), columns));
  tr.appendChild(cell("time", formatDate(log.created_at), columns));

  const typeCell = cell("type", "", columns);
  const badge = document.createElement("span");
  badge.className = `badge badge-${severity(log).toLowerCase()}`;
  badge.textContent = severity(log);
  typeCell.appendChild(badge);
  tr.appendChild(typeCell);

  tr.appendChild(cell("script-path", log.script_path || "", columns));
  tr.appendChild(cell("message", log.message || "", columns));

  const actionCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn-delete";
  deleteButton.dataset.id = String(log.id);
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    if (onDeleteCallback) onDeleteCallback(log.id);
  });
  actionCell.appendChild(deleteButton);
  tr.appendChild(actionCell);

  return tr;
}

function cell(column, text, columns) {
  const td = document.createElement("td");
  td.dataset.col = column;
  td.textContent = text;
  td.hidden = columns[column] === false;
  return td;
}

function clearRows() {
  rowsById.forEach((row) => row.remove());
  rowsById.clear();
}

function showEmptyState(tbody) {
  if (emptyRow && emptyRow.isConnected) return;

  emptyRow = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 7;
  td.style.textAlign = "center";
  td.style.padding = "1rem";
  td.textContent = "No logs found.";
  emptyRow.appendChild(td);
  tbody.appendChild(emptyRow);
}

function hideEmptyState() {
  if (emptyRow) {
    emptyRow.remove();
    emptyRow = null;
  }
}

export function updateCounts(allLogs) {
  let errorCount = 0;
  let warnCount = 0;
  let infoCount = 0;

  allLogs.forEach((log) => {
    const type = severity(log);
    if (type === "ERROR") errorCount++;
    else if (type === "WARNING") warnCount++;
    else infoCount++;
  });

  document.getElementById("countError").textContent = errorCount;
  document.getElementById("countWarn").textContent = warnCount;
  document.getElementById("countInfo").textContent = infoCount;
}

export function updateColumnVisibility(columnName, isVisible) {
  const cells = document.querySelectorAll(`[data-col="${columnName}"]`);
  cells.forEach((cell) => {
    cell.hidden = !isVisible;
  });
}

export function updateSystemStatus(isOnline) {
  const statusDot = document.getElementById("statusDot");
  if (!statusDot) return;

  if (isOnline) {
    statusDot.setAttribute("data-status", "online");
    statusDot.setAttribute("aria-label", "System status: online");
  } else {
    statusDot.setAttribute("data-status", "offline");
    statusDot.setAttribute("aria-label", "System status: offline");
  }
}

function severity(log) {
  const value = String(log.log_type || "INFO").toUpperCase();
  return ["ERROR", "WARNING", "INFO"].includes(value) ? value : "INFO";
}

function formatDate(dateString) {
  if (!dateString) return "";

  const match = String(dateString).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );

  const date = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6]),
      )
    : new Date(dateString);

  return Number.isNaN(date.getTime()) ? String(dateString) : date.toLocaleString();
}
