export default class ErrorHandler {
  #elem = null;

  constructor(elem) {
    this.#elem = elem;
  }

  show(message) {
    this.#elem.textContent = message;
    this.#elem.hidden = false;
  }

  hide() {
    this.#elem.hidden = true;
  }
}
