export default class DemoService {
  #messages = [
    "You need to add the .gd files from godot_root to your own Godot project.",
    "You need to run the backend on your own device.",
    "Visit the GitHub page for the setup steps: https://github.com/FruHuszar/GodotPhpLogViewer",
  ];

  #logs = [];

  constructor() {
    this.#logs = this.#messages.map((message, index) => ({
      id: index + 1,
      created_at: this.#timestamp(),
      log_type: "INFO",
      script_path: "",
      message,
    }));
  }

  getLogs() {
    return Promise.resolve([...this.#logs].reverse());
  }

  deleteLog(id) {
    this.#logs = this.#logs.filter((log) => String(log.id) !== String(id));

    return Promise.resolve();
  }

  deleteAllLogs() {
    this.#logs = [];

    return Promise.resolve();
  }

  #timestamp() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offset).toISOString().slice(0, 19).replace("T", " ");
  }
}
