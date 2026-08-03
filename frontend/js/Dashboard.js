import Log from "./Log.js";
import Controls from "./Controls.js";
import Modal from "./Modal.js";

export default class Dashboard {
  #service = null;
  #logs = null;
  #header = null;
  #controls = null;
  #alert = null;
  #export = null;
  #errorHandler = null;
  #runningWindowMs = 0;
  #lista = [];
  #lastSeenId = null;
  #lastArrivalAt = 0;
  #loading = false;

  constructor(
    service,
    logs,
    header,
    controls,
    alert,
    exportService,
    errorHandler,
    pollIntervalMs,
    runningWindowMs,
  ) {
    this.#service = service;
    this.#logs = logs;
    this.#header = header;
    this.#controls = controls;
    this.#alert = alert;
    this.#export = exportService;
    this.#errorHandler = errorHandler;
    this.#runningWindowMs = runningWindowMs;
    this.listenEvents();
    this.load();
    setInterval(() => this.load(), pollIntervalMs);
  }

  listenEvents() {
    this.#logs.szuloElem.addEventListener(Log.EVENTS.DELETE, (esemeny) => {
      this.#run(() => this.#service.deleteLog(esemeny.detail));
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.VIEW, () => {
      this.render();
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.COLUMN, (esemeny) => {
      this.#logs.showColumn(esemeny.detail.column, esemeny.detail.visible);
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.AUDIO, (esemeny) => {
      this.#switchAlert(esemeny.detail.enabled);
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.KEYWORD, (esemeny) => {
      this.#alert.setKeyword(esemeny.detail.keyword);
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.EXPORT, () => {
      this.#exportLogs();
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.DELETE_SELECTED, () => {
      this.#deleteSelected();
    });

    this.#controls.szuloElem.addEventListener(Controls.EVENTS.CLEAR, () => {
      new Modal(
        "Delete every log from the database?",
        { label: "Delete everything", run: () => this.#clear() },
        "Cancel",
      );
    });
  }

  load() {
    if (this.#loading) {
      return Promise.resolve();
    }

    this.#loading = true;

    return this.#service
      .getLogs()
      .then((lista) => {
        this.#lista = lista.map((log) => ({ ...log, log_type: this.#severity(log) }));
        this.#errorHandler.hide();

        const arrivals = this.#arrivals();

        this.#header.showStatus(this.#status());
        this.render();
        this.#alert.play(arrivals);
      })
      .catch((hiba) => {
        this.#header.showStatus("offline");
        this.#errorHandler.show(
          `${hiba.message} Check that the PHP server and MySQL are running.`,
        );
      })
      .finally(() => {
        this.#loading = false;
      });
  }

  render() {
    this.#logs.render(this.#filteredList());
    this.#header.showCounts(this.#counts());
  }

  #severity(log) {
    const type = String(log.log_type ?? "").toUpperCase();

    return ["ERROR", "WARNING", "INFO"].includes(type) ? type : "INFO";
  }

  #filteredList() {
    return this.#lista.filter((log) => this.#matches(log));
  }

  #matches(log) {
    const filter = this.#controls.filter;
    const search = this.#controls.search;
    const haystack = `${log.message ?? ""} ${log.script_path ?? ""}`.toLowerCase();

    return (
      (filter === "ALL" || log.log_type === filter) &&
      (search === "" || haystack.includes(search))
    );
  }

  #counts() {
    const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
    this.#lista.forEach((log) => (counts[log.log_type] += 1));

    return counts;
  }

  #arrivals() {
    const known = this.#lastSeenId;

    this.#lastSeenId = this.#lista.reduce(
      (max, log) => Math.max(max, Number(log.id) || 0),
      0,
    );

    if (known === null) {
      return [];
    }

    const arrivals = this.#lista.filter((log) => Number(log.id) > known);

    if (arrivals.length > 0) {
      this.#lastArrivalAt = Date.now();
    }

    return arrivals;
  }

  #status() {
    return Date.now() - this.#lastArrivalAt < this.#runningWindowMs
      ? "running"
      : "listening";
  }

  #switchAlert(isEnabled) {
    this.#alert.setEnabled(isEnabled);

    if (!isEnabled) {
      return;
    }

    this.#alert.load().then((isLoaded) => {
      if (!isLoaded) {
        new Modal(
          "No alert.wav or alert.mp3 in the frontend/audio folder. Drop one in and tick the box again.",
          null,
          "OK",
        );
      }
    });
  }

  #exportLogs() {
    if (this.#filteredList().length === 0) {
      new Modal("There are no logs to export yet.", null, "OK");
      return;
    }

    if (this.#logs.selectedIds.length === 0) {
      new Modal(
        "Nothing is selected. Tick the rows you want, or export every row in the table.",
        {
          label: "I meant to select all",
          run: () => {
            this.#logs.selectAll();
            this.#exportSelected();
          },
        },
        "OK",
      );
      return;
    }

    this.#exportSelected();
  }

  #exportSelected() {
    const selected = new Set(this.#logs.selectedIds);

    this.#export.save(this.#lista.filter((log) => selected.has(String(log.id))));
  }

  #deleteSelected() {
    const ids = this.#logs.selectedIds;

    if (ids.length === 0) {
      new Modal("Nothing is selected. Tick the rows you want to remove.", null, "OK");
      return;
    }

    this.#run(() => Promise.all(ids.map((id) => this.#service.deleteLog(id))));
  }

  #clear() {
    this.#lastSeenId = null;
    this.#run(() => this.#service.deleteAllLogs());
  }

  #run(action) {
    return action()
      .then(() => this.load())
      .catch((hiba) => this.#errorHandler.show(hiba.message));
  }
}
