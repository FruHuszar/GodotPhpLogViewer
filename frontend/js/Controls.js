export default class Controls {
  static EVENTS = {
    VIEW: "controls:view",
    COLUMN: "controls:column",
    AUDIO: "controls:audio",
    KEYWORD: "controls:keyword",
    EXPORT: "controls:export",
    DELETE_SELECTED: "controls:deleteSelected",
    CLEAR: "controls:clear",
  };

  #searchElem = null;
  #filterElems = [];
  #columnElems = [];
  #audioElem = null;
  #keywordElem = null;
  #setElem = null;
  #statusElem = null;
  #filter = "ALL";
  #search = "";

  constructor(szuloElem) {
    this.szuloElem = szuloElem;
    this.#searchElem = szuloElem.querySelector("#searchInput");
    this.#filterElems = [...szuloElem.querySelectorAll("[data-filter]")];
    this.#columnElems = [...szuloElem.querySelectorAll("[data-column]")];
    this.#audioElem = szuloElem.querySelector("#audioToggle");
    this.#keywordElem = szuloElem.querySelector("#audioKeyword");
    this.#setElem = szuloElem.querySelector("#btnSetAudio");
    this.#statusElem = szuloElem.querySelector("#audioStatus");
    this.listenEvents();
  }

  get filter() {
    return this.#filter;
  }

  get search() {
    return this.#search;
  }

  listenEvents() {
    this.#listenSearch();
    this.#listenFilters();
    this.#listenColumns();
    this.#listenAudio();
    this.#listenActions();
  }

  #listenSearch() {
    this.#searchElem.addEventListener("input", () => {
      this.#search = this.#searchElem.value.trim().toLowerCase();
      this.#send(Controls.EVENTS.VIEW);
    });
  }

  #listenFilters() {
    this.#filterElems.forEach((button) => {
      button.addEventListener("click", () => {
        this.#filterElems.forEach((other) => other.setAttribute("aria-pressed", "false"));
        button.setAttribute("aria-pressed", "true");

        this.#filter = button.dataset.filter;
        this.#send(Controls.EVENTS.VIEW);
      });
    });
  }

  #listenColumns() {
    this.#columnElems.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        this.#send(Controls.EVENTS.COLUMN, {
          column: checkbox.dataset.column,
          visible: checkbox.checked,
        });
      });
    });
  }

  #listenAudio() {
    this.#audioElem.addEventListener("change", () => {
      const isEnabled = this.#audioElem.checked;

      this.#keywordElem.disabled = !isEnabled;
      this.#setElem.disabled = !isEnabled;
      this.#keywordElem.value = "";
      this.#setElem.textContent = "Set";
      this.#statusElem.textContent = isEnabled
        ? "Alert mode: every incoming log makes a sound."
        : "Silent mode: no incoming log makes a sound.";

      if (isEnabled) {
        this.#keywordElem.focus();
      }

      this.#send(Controls.EVENTS.AUDIO, { enabled: isEnabled });
    });

    this.#setElem.addEventListener("click", () => this.#commitKeyword());

    this.#keywordElem.addEventListener("keydown", (esemeny) => {
      if (esemeny.key === "Enter") {
        this.#commitKeyword();
      }
    });
  }

  #commitKeyword() {
    const keyword = this.#keywordElem.value.trim().toLowerCase();

    this.#setElem.textContent = keyword ? "Set ✓" : "Set";
    this.#statusElem.textContent = keyword
      ? `Attention mode: only logs matching "${keyword}" make a sound.`
      : "Alert mode: every incoming log makes a sound.";

    this.#send(Controls.EVENTS.KEYWORD, { keyword });
  }

  #listenActions() {
    this.szuloElem
      .querySelector("#btnExport")
      .addEventListener("click", () => this.#send(Controls.EVENTS.EXPORT));

    this.szuloElem
      .querySelector("#btnDeleteSelected")
      .addEventListener("click", () => this.#send(Controls.EVENTS.DELETE_SELECTED));

    this.szuloElem
      .querySelector("#btnClear")
      .addEventListener("click", () => this.#send(Controls.EVENTS.CLEAR));
  }

  #send(nev, detail = {}) {
    this.szuloElem.dispatchEvent(new CustomEvent(nev, { detail }));
  }
}
