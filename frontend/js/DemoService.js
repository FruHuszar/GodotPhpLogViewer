const DEMO_MESSAGES = [
  "You need to add the .gd files from godot_root to your own Godot project.",
  "You need to run the backend on your own device.",
  "Visit the GitHub page for the setup steps: https://github.com/FruHuszar/GodotPhpLogViewer",
];

export default class DemoService {
  #logs = DEMO_MESSAGES.map((message, index) => ({
    id: index + 1,
    created_at: localTimestamp(),
    log_type: "INFO",
    script_path: "",
    message,
  }));

  async getLogs() {
    return [...this.#logs].reverse();
  }

  async deleteLog(id) {
    this.#logs = this.#logs.filter((log) => String(log.id) !== String(id));
  }

  async deleteAllLogs() {
    this.#logs = [];
  }
}

function localTimestamp() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 19).replace("T", " ");
}
