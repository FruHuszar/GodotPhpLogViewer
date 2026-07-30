import Logs from "./Logs.js";
import { state } from "./state.js";
import { loadAlertSound } from "./utils/audio.js";

export function selectedIds() {
  return [...document.querySelectorAll(".row-select:checked")].map(
    (checkbox) => checkbox.dataset.id,
  );
}

export function selectAllRows() {
  document.getElementById("selectAllRows").checked = true;
  document
    .querySelectorAll(".row-select")
    .forEach((checkbox) => (checkbox.checked = true));
}

export function bindControls() {
  bindSearch();
  bindFilters();
  bindAudio();
  bindColumns();
  bindSelection();
  bindActions();
}

function bindSearch() {
  document.getElementById("searchInput").addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    emit("viewChange");
  });
}

function bindFilters() {
  const buttons = document.querySelectorAll("[data-filter]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((other) => other.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");

      state.filter = button.dataset.filter;
      emit("viewChange");
    });
  });
}

function bindAudio() {
  const toggle = document.getElementById("audioToggle");
  const keyword = document.getElementById("audioKeyword");
  const setButton = document.getElementById("btnSetAudio");
  const status = document.getElementById("audioStatus");

  toggle.addEventListener("change", async () => {
    state.audioEnabled = toggle.checked;
    state.audioKeyword = "";
    keyword.disabled = !toggle.checked;
    setButton.disabled = !toggle.checked;
    keyword.value = "";
    setButton.textContent = "Set";
    status.textContent = toggle.checked
      ? "Alert mode: every incoming log makes a sound."
      : "Silent mode: no incoming log makes a sound.";

    if (!toggle.checked) return;

    keyword.focus();
    if (!(await loadAlertSound())) emit("alertSoundMissing");
  });

  const commit = () => {
    state.audioKeyword = keyword.value.trim().toLowerCase();
    setButton.textContent = state.audioKeyword ? "Set ✓" : "Set";
    status.textContent = state.audioKeyword
      ? `Attention mode: only logs matching "${state.audioKeyword}" make a sound.`
      : "Alert mode: every incoming log makes a sound.";
  };

  setButton.addEventListener("click", commit);
  keyword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") commit();
  });
}

function bindColumns() {
  document.querySelectorAll("[data-column]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const column = checkbox.dataset.column;
      state.columns[column] = checkbox.checked;
      Logs.showColumn(column, checkbox.checked);
    });
  });
}

function bindSelection() {
  document.getElementById("selectAllRows").addEventListener("change", (event) => {
    document
      .querySelectorAll(".row-select")
      .forEach((checkbox) => (checkbox.checked = event.target.checked));
  });
}

function bindActions() {
  document
    .getElementById("btnExport")
    .addEventListener("click", () => emit("logsExport"));

  document
    .getElementById("btnClear")
    .addEventListener("click", () => emit("logsClear"));

  document
    .getElementById("btnDeleteSelected")
    .addEventListener("click", () => emit("logsDeleteSelected"));
}

function emit(name) {
  window.dispatchEvent(new CustomEvent(name));
}
