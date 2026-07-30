import { state, severity } from "./state.js";

const ESCAPED = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

export default class Log {
  #obj = {};

  constructor(obj = { id, created_at, log_type, script_path, message }, parentElem) {
    this.#obj = obj;
    this.parentElem = parentElem;
    this.render();

    this.rowElem = this.parentElem.lastElementChild;
    this.rowElem
      .querySelector(".btn-delete")
      .addEventListener("click", () => this.deleteEvent());
  }

  render() {
    const type = severity(this.#obj);
    const code = `
      <tr data-severity="${type.toLowerCase()}">
        <td>
          <input
            type="checkbox"
            class="row-select"
            data-id="${this.#obj.id}"
            aria-label="Select log ${this.#obj.id}"
          />
        </td>
        ${this.cell("id", this.#obj.id)}
        ${this.cell("time", this.time())}
        ${this.cell("type", `<span class="badge">${type}</span>`, false)}
        ${this.cell("script-path", this.#obj.script_path)}
        ${this.cell("message", this.#obj.message)}
        <td><button type="button" class="btn-delete">Delete</button></td>
      </tr>
    `;

    this.parentElem.insertAdjacentHTML("beforeend", code);
  }

  cell(column, content, escaped = true) {
    const hidden = state.columns[column] ? "" : "hidden";
    return `<td data-col="${column}" ${hidden}>${escaped ? this.escape(content) : content}</td>`;
  }

  escape(content) {
    return String(content ?? "").replace(/[&<>"]/g, (sign) => ESCAPED[sign]);
  }

  time() {
    const date = new Date(String(this.#obj.created_at || "").replace(" ", "T"));
    return Number.isNaN(date.getTime()) ? this.#obj.created_at : date.toLocaleString();
  }

  deleteEvent() {
    window.dispatchEvent(new CustomEvent("logDelete", { detail: this.#obj.id }));
  }
}
