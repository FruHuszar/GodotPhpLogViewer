import Log from "./Log.js";
import { state } from "./state.js";

export default class Logs {
  #list = [];

  constructor(list, parentElem) {
    this.#list = list;
    this.parentElem = parentElem;
    this.render();
  }

  render() {
    const ids = this.#list.map((log) => log.id).join(",");
    if (ids === state.renderedIds) return;

    state.renderedIds = ids;
    document.getElementById("selectAllRows").checked = false;
    this.parentElem.innerHTML = this.#list.length ? "" : this.emptyRow();
    this.#list.forEach((log) => new Log(log, this.parentElem));
  }

  emptyRow() {
    return `
      <tr class="empty">
        <td colspan="7">No logs yet. Start the game and they show up here.</td>
      </tr>
    `;
  }

  static showColumn(column, isVisible) {
    document
      .querySelectorAll(`[data-col="${column}"]`)
      .forEach((cell) => (cell.hidden = !isVisible));
  }
}
