import Service from "./Service.js";
import DemoService from "./DemoService.js";
import ErrorHandler from "./ErrorHandler.js";
import Logs from "./Logs.js";
import Modal from "./Modal.js";
import { bindControls, selectedIds, selectAllRows } from "./controls.js";
import { updateCounts, updateStatus } from "./header.js";
import { state, filteredLogs, counts, newArrivals, connectionStatus } from "./state.js";
import { playAlertFor } from "./utils/audio.js";
import { exportToCSV } from "./utils/export.js";
import { POLL_INTERVAL_MS, runningLocally } from "./config.js";

const TABLE_BODY = document.getElementById("logTableBody");

const service = runningLocally() ? new Service() : new DemoService();
const errorHandler = new ErrorHandler("#errorBanner");

let isLoading = false;

async function loadLogs() {
  if (isLoading) return;
  isLoading = true;

  try {
    state.logs = await service.getLogs();
    errorHandler.hide();

    const arrivals = newArrivals(state.logs);
    updateStatus(connectionStatus());
    render();
    playAlertFor(arrivals);
  } catch (error) {
    updateStatus("offline");
    errorHandler.show(
      `${error.message} Check that the PHP server and MySQL are running.`,
    );
  } finally {
    isLoading = false;
  }
}

function render() {
  new Logs(filteredLogs(), TABLE_BODY);
  updateCounts(counts());
}

async function run(action) {
  try {
    await action();
    await loadLogs();
  } catch (error) {
    errorHandler.show(error.message);
  }
}

function exportSelected() {
  const chosen = new Set(selectedIds());
  exportToCSV(state.logs.filter((log) => chosen.has(String(log.id))));
}

function exportEveryRow() {
  selectAllRows();
  exportSelected();
}

function clearAllLogs() {
  run(() => {
    state.lastSeenId = null;
    return service.deleteAllLogs();
  });
}

bindControls();

window.addEventListener("viewChange", render);

window.addEventListener("logDelete", (event) =>
  run(() => service.deleteLog(event.detail)),
);

window.addEventListener("logsExport", () => {
  if (filteredLogs().length === 0) {
    new Modal("There are no logs to export yet.", null, "OK");
    return;
  }

  if (selectedIds().length === 0) {
    new Modal(
      "Nothing is selected. Tick the rows you want, or export every row in the table.",
      { label: "I meant to select all", run: exportEveryRow },
      "OK",
    );
    return;
  }

  exportSelected();
});

window.addEventListener("logsDeleteSelected", () => {
  const ids = selectedIds();

  if (ids.length === 0) {
    new Modal("Nothing is selected. Tick the rows you want to remove.", null, "OK");
    return;
  }

  run(() => Promise.all(ids.map((id) => service.deleteLog(id))));
});

window.addEventListener("logsClear", () =>
  new Modal(
    "Delete every log from the database?",
    { label: "Delete everything", run: clearAllLogs },
    "Cancel",
  ),
);

window.addEventListener("alertSoundMissing", () =>
  new Modal(
    "No alert.wav or alert.mp3 in the frontend/audio folder. Drop one in and tick the box again.",
    null,
    "OK",
  ),
);

loadLogs();
setInterval(loadLogs, POLL_INTERVAL_MS);
