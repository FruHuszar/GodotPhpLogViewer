import { fetchLogs, deleteLogById, deleteAllLogs } from "./api.js";
import { POLL_INTERVAL_MS, MAX_EXPORT_ROWS } from "./config.js";
import {
  setLogs,
  getLogs,
  setActiveFilter,
  setSearchTerm,
  setAudioEnabled,
  setAudioKeyword,
  setColumnVisible,
  setLastSeenLogId,
  getFilteredLogs,
  getActiveFilter,
  getSearchTerm,
} from "./state.js";
import {
  renderTable,
  updateCounts,
  updateColumnVisibility,
  updateSystemStatus,
} from "./render.js";
import { checkAndPlayAudioAlert } from "./utils/audio.js";
import { exportToCSV } from "./utils/export.js";

document.addEventListener("DOMContentLoaded", () => {
  initApp();

  setInterval(() => {
    loadLogs();
  }, POLL_INTERVAL_MS);
});

async function initApp() {
  setupEventListeners();
  await loadLogs();
}

let isLoading = false;

async function loadLogs() {
  if (isLoading) return;
  isLoading = true;

  try {
    const logs = await fetchLogs();

    updateSystemStatus(true);
    setLogs(logs);
    refreshUI();
    checkAndPlayAudioAlert(logs);
  } catch (error) {
    console.error("Could not reach the log API:", error);
    updateSystemStatus(false);
  } finally {
    isLoading = false;
  }
}

function refreshUI() {
  const filteredLogs = getFilteredLogs();
  const allLogs = getLogs();

  renderTable(filteredLogs, handleSingleDelete);
  updateCounts(allLogs);
}

async function handleSingleDelete(id) {
  try {
    await deleteLogById(id);
    await loadLogs();
  } catch (error) {
    console.error(`Error deleting log with ID ${id}:`, error);
    alert(`Failed to delete log #${id}`);
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      setSearchTerm(e.target.value);
      refreshUI();
    });
  }

  const filterButtons = document.querySelectorAll("[data-filter]");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");

      const filterValue = btn.getAttribute("data-filter");
      setActiveFilter(filterValue);
      refreshUI();
    });
  });

  const audioToggle = document.getElementById("audioToggle");
  const audioKeywordInput = document.getElementById("audioKeyword");
  const btnSetAudio = document.getElementById("btnSetAudio");

  function applyAudioAvailability(enabled) {
    if (audioKeywordInput) audioKeywordInput.disabled = !enabled;
    if (btnSetAudio) btnSetAudio.disabled = !enabled;
  }

  if (audioToggle) {
    applyAudioAvailability(audioToggle.checked);

    audioToggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      setAudioEnabled(enabled);
      applyAudioAvailability(enabled);

      if (!enabled) {
        setAudioKeyword("");
      } else if (audioKeywordInput) {
        audioKeywordInput.focus();
      }
    });
  }

  if (btnSetAudio && audioKeywordInput) {
    const commitKeyword = () => {
      setAudioKeyword(audioKeywordInput.value);
      btnSetAudio.textContent = audioKeywordInput.value.trim() ? "Set ✓" : "Set";
    };

    btnSetAudio.addEventListener("click", commitKeyword);

    audioKeywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commitKeyword();
    });
  }

  const btnExport = document.getElementById("btnExport");
  if (btnExport) {
    btnExport.addEventListener("click", async () => {
      btnExport.disabled = true;
      const label = btnExport.textContent;
      btnExport.textContent = "Exporting...";

      try {
        const rows = await fetchLogs({
          limit: MAX_EXPORT_ROWS,
          type: getActiveFilter(),
          search: getSearchTerm(),
        });
        exportToCSV(rows);
      } catch (error) {
        console.error("Export failed, falling back to the loaded rows:", error);
        exportToCSV(getFilteredLogs());
      } finally {
        btnExport.textContent = label;
        btnExport.disabled = false;
      }
    });
  }

  const btnClear = document.getElementById("btnClear");
  if (btnClear) {
    btnClear.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete ALL logs?")) {
        try {
          await deleteAllLogs();
          setLastSeenLogId(null);
          await loadLogs();
        } catch (error) {
          console.error("Error deleting all logs:", error);
          alert("Failed to clear logs.");
        }
      }
    });
  }

  const columnCheckboxes = document.querySelectorAll("[data-column]");
  columnCheckboxes.forEach((cb) => {
    cb.addEventListener("change", (e) => {
      const colName = cb.getAttribute("data-column");
      const isChecked = e.target.checked;

      setColumnVisible(colName, isChecked);
      updateColumnVisibility(colName, isChecked);
    });
  });

  const selectAllRows = document.getElementById("selectAllRows");
  if (selectAllRows) {
    selectAllRows.addEventListener("change", (e) => {
      const rowCheckboxes = document.querySelectorAll(".row-select");
      rowCheckboxes.forEach((cb) => {
        cb.checked = e.target.checked;
      });
    });
  }
}
