import { API_BASE_URL, MAX_ROWS } from "./config.js";

export default class Service {
  #url = API_BASE_URL;

  async getLogs({ limit = MAX_ROWS, type = "ALL", search = "" } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });

    if (type !== "ALL") params.set("type", type);
    if (search) params.set("q", search);

    const payload = await this.#request(`${this.#url}?${params}`);
    return Array.isArray(payload.data) ? payload.data : [];
  }

  deleteLog(id) {
    return this.#request(`${this.#url}/${id}`, { method: "DELETE" });
  }

  deleteAllLogs() {
    return this.#request(this.#url, { method: "DELETE" });
  }

  async #request(url, options = {}) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      ...options,
    }).catch(() => {
      throw new Error("Cannot reach the log API.");
    });

    if (!response.ok) {
      throw new Error(`The log API answered with status ${response.status}.`);
    }

    return response.json();
  }
}
