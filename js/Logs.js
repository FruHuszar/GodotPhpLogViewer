import Log from "./Log.js";

export default class Logs {
  #torzsElem = null;
  #selectAllElem = null;
  #logok = [];
  #renderedIds = null;
  #columns = {
    id: true,
    time: true,
    type: true,
    "script-path": true,
    message: true,
  };

  constructor(szuloElem) {
    this.szuloElem = szuloElem;
    this.#torzsElem = szuloElem.querySelector("tbody");
    this.#selectAllElem = szuloElem.querySelector("#selectAllRows");
    this.listenEvents();
  }

  get selectedIds() {
    return [...this.#torzsElem.querySelectorAll(".row-select:checked")].map(
      (checkbox) => checkbox.dataset.id,
    );
  }

  listenEvents() {
    this.#selectAllElem.addEventListener("change", () => {
      this.#checkRows(this.#selectAllElem.checked);
    });
  }

  render(lista) {
    const ids = lista.map((log) => log.id).join(",");

    if (ids === this.#renderedIds) {
      return;
    }

    this.#renderedIds = ids;
    this.#selectAllElem.checked = false;
    this.#torzsElem.innerHTML = lista.length === 0 ? this.#emptyRow() : "";
    this.#logok = lista.map((obj) => new Log(obj, this.#columns, this.#torzsElem));
  }

  selectAll() {
    this.#selectAllElem.checked = true;
    this.#checkRows(true);
  }

  showColumn(column, isVisible) {
    this.#columns[column] = isVisible;
    this.szuloElem
      .querySelectorAll(`[data-col="${column}"]`)
      .forEach((cell) => (cell.hidden = !isVisible));
  }

  #checkRows(isChecked) {
    this.#torzsElem
      .querySelectorAll(".row-select")
      .forEach((checkbox) => (checkbox.checked = isChecked));
  }

  #emptyRow() {
    return `
      <tr class="empty">
        <td colspan="7">No logs yet. Start the game and they show up here.</td>
      </tr>
    `;
  }
}
