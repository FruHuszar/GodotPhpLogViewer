export default class Modal {
  #message = "";
  #action = null;

  constructor(message, action = null, closeLabel = "Close") {
    this.#message = message;
    this.#action = action;
    this.closeLabel = closeLabel;
    this.render();

    this.element = document.body.lastElementChild;
    this.element.addEventListener("close", () => this.element.remove());
    this.element
      .querySelector(".modal-close")
      .addEventListener("click", () => this.element.close());

    if (this.#action) this.bindAction();

    this.element.showModal();
  }

  render() {
    const code = `
      <dialog class="modal">
        <p>${this.#message}</p>
        <div class="modal-actions">
          <button type="button" class="modal-close" ${this.#action ? "" : "autofocus"}>${this.closeLabel}</button>
          ${this.#action ? `<button type="button" class="modal-action" autofocus>${this.#action.label}</button>` : ""}
        </div>
      </dialog>
    `;

    document.body.insertAdjacentHTML("beforeend", code);
  }

  bindAction() {
    this.element.querySelector(".modal-action").addEventListener("click", () => {
      this.element.close();
      this.#action.run();
    });
  }
}
