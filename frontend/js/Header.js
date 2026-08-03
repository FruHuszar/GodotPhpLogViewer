export default class Header {
  #dotElem = null;
  #statusElem = null;
  #countElems = {};
  #labels = {
    running: "receiving logs",
    listening: "listening",
    offline: "no connection",
  };

  constructor(szuloElem) {
    this.szuloElem = szuloElem;
    this.#dotElem = szuloElem.querySelector("#statusDot");
    this.#statusElem = szuloElem.querySelector("#statusText");
    this.#countElems = {
      ERROR: szuloElem.querySelector("#countError"),
      WARNING: szuloElem.querySelector("#countWarn"),
      INFO: szuloElem.querySelector("#countInfo"),
    };
  }

  showCounts(counts) {
    Object.entries(this.#countElems).forEach(([type, elem]) => {
      elem.textContent = counts[type];
    });
  }

  showStatus(status) {
    this.#dotElem.dataset.status = status;
    this.#statusElem.textContent = this.#labels[status];
  }
}
