import Service from "./Service.js";
import DemoService from "./DemoService.js";
import Dashboard from "./Dashboard.js";
import Logs from "./Logs.js";
import Header from "./Header.js";
import Controls from "./Controls.js";
import Alert from "./Alert.js";
import Export from "./Export.js";
import ErrorHandler from "./ErrorHandler.js";

const API_URL = "http://localhost:8000/api/logs";
const MAX_ROWS = 500;
const POLL_INTERVAL_MS = 1000;
const RUNNING_WINDOW_MS = 8000;
const ALERT_SOURCES = ["audio/alert.wav", "audio/alert.mp3"];
const ALERT_COOLDOWN_MS = 1500;
const LOCAL = /^(localhost|\[::1\]|127\.|192\.|$)/.test(window.location.hostname);

new Dashboard(
  LOCAL ? new Service(API_URL, MAX_ROWS) : new DemoService(),
  new Logs(document.querySelector("#logTable")),
  new Header(document.querySelector("header")),
  new Controls(document.querySelector("main")),
  new Alert(ALERT_SOURCES, ALERT_COOLDOWN_MS),
  new Export(),
  new ErrorHandler(document.querySelector("#errorBanner")),
  POLL_INTERVAL_MS,
  RUNNING_WINDOW_MS,
);
