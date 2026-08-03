export default class Log {
  static EVENTS = {
    DELETE: "log:delete",
  };

  #obj = {};
  #columns = {};

  constructor(obj = { id, created_at, log_type, script_path, message }, columns, szuloElem) {
    this.#obj = obj;
    this.#columns = columns;
    this.szuloElem = szuloElem;
    this.render();
    this.listenEvents();
  }

  render() {
    this.szuloElem.insertAdjacentHTML("beforeend", this.#code());
    this.elem = this.szuloElem.lastElementChild;
  }

  listenEvents() {
    this.elem.querySelector(".btn-delete").addEventListener("click", () => {
      this.elem.dispatchEvent(
        new CustomEvent(Log.EVENTS.DELETE, { detail: this.#obj.id, bubbles: true }),
      );
    });
  }

  #code() {
    return `
      <tr data-severity="${this.#obj.log_type.toLowerCase()}">
        <td>
          <input
            type="checkbox"
            class="row-select"
            data-id="${this.#obj.id}"
            aria-label="Select log ${this.#obj.id}"
          />
        </td>
        ${this.#cell("id", this.#safe(this.#obj.id))}
        ${this.#cell("time", this.#safe(this.#time()))}
        ${this.#cell("type", `<span class="badge">${this.#obj.log_type}</span>`)}
        ${this.#cell("script-path", this.#safe(this.#obj.script_path))}
        ${this.#cell("message", this.#safe(this.#obj.message))}
        <td><button type="button" class="btn-delete">Delete</button></td>
      </tr>
    `;
  }

  #cell(column, content) {
    return `<td data-col="${column}" ${this.#columns[column] ? "" : "hidden"}>${content}</td>`;
  }

  #safe(content) {
    const elem = document.createElement("div");
    elem.textContent = content ?? "";

    return elem.innerHTML;
  }

  #time() {
    const date = new Date(String(this.#obj.created_at ?? "").replace(" ", "T"));

    return Number.isNaN(date.getTime()) ? this.#obj.created_at : date.toLocaleString();
  }
}
