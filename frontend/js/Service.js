export default class Service {
  #url = "";
  #maxRows = 0;

  constructor(url, maxRows) {
    this.#url = url;
    this.#maxRows = maxRows;
  }

  getLogs() {
    return this.#request(`${this.#url}?limit=${this.#maxRows}`).then((payload) =>
      Array.isArray(payload.data) ? payload.data : [],
    );
  }

  deleteLog(id) {
    return this.#request(`${this.#url}/${id}`, { method: "DELETE" });
  }

  deleteAllLogs() {
    return this.#request(this.#url, { method: "DELETE" });
  }

  #request(url, options = {}) {
    return fetch(url, { headers: { Accept: "application/json" }, ...options })
      .catch(() => {
        throw new Error("Cannot reach the log API.");
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`The log API answered with status ${response.status}.`);
        }

        return response.json();
      });
  }
}
