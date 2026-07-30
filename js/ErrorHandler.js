export default class ErrorHandler {
  #element;

  constructor(selector) {
    this.#element = document.querySelector(selector);
  }

  show(message) {
    this.#element.textContent = message;
    this.#element.hidden = false;
  }

  hide() {
    this.#element.hidden = true;
  }
}
