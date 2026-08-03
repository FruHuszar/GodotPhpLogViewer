export default class Alert {
  #sources = [];
  #cooldownMs = 0;
  #sound = null;
  #lastPlayedAt = 0;
  #enabled = false;
  #keyword = "";

  constructor(sources, cooldownMs) {
    this.#sources = sources;
    this.#cooldownMs = cooldownMs;
  }

  setEnabled(isEnabled) {
    this.#enabled = isEnabled;
    this.#keyword = "";
  }

  setKeyword(keyword) {
    this.#keyword = keyword;
  }

  load() {
    if (this.#sound) {
      return Promise.resolve(true);
    }

    return this.#sources.reduce(
      (chain, source) => chain.then((found) => (found ? true : this.#loadSource(source))),
      Promise.resolve(false),
    );
  }

  play(arrivals) {
    if (!this.#enabled || !this.#sound) {
      return;
    }

    if (!arrivals.some((log) => this.#matches(log))) {
      return;
    }

    if (Date.now() - this.#lastPlayedAt < this.#cooldownMs) {
      return;
    }

    this.#lastPlayedAt = Date.now();
    this.#sound.currentTime = 0;
    this.#sound.play().catch(() => {});
  }

  #loadSource(source) {
    return fetch(source, { method: "HEAD" })
      .catch(() => null)
      .then((response) => {
        if (!response?.ok) {
          return false;
        }

        this.#sound = new Audio(source);

        return true;
      });
  }

  #matches(log) {
    if (this.#keyword === "") {
      return true;
    }

    return `${log.message ?? ""} ${log.script_path ?? ""}`
      .toLowerCase()
      .includes(this.#keyword);
  }
}
