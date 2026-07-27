# Godot Centralized Log Viewer

A HTTP-based real-time error log aggregator, filter, and analytics web dashboard for
Godot game development.

## About The Project & Motivation

During development in the Godot engine, missing assets, configuration notices, and other
minor issues often clutter the console with dozens of warnings (WARNING). As a result,
critical, code-breaking error messages (ERROR) easily get lost in the noise.

The Godot Centralized Log Viewer solves this problem: it automatically sends logs
generated during game development to a local PHP backend, stores them in a MySQL
database, and displays them live on a clean web interface. The web app also assists
development with filtering, CSV export, and specific error monitoring features.

## Key Features

- **Live Log Collection:** The Godot game automatically sends logs using HTTP POST requests.
- **Type-Based Filtering:** One-click filtering for ERROR, WARNING, and INFO categories.
- **Real-time Audio Alert:** If you are expecting a specific error or a new ERROR during
  testing, the system instantly alerts you with a sound notification when the error occurs.
- **CSV Export:** The filtered or complete log data can be downloaded with a single click
  in .csv format for further analysis.
- **Search Bar:** Text-based search within message content and .gd script file paths.
- **Quick Management:** Delete individual logs (DELETE) or clear the entire database with
  a single click.

## Technologies Used

- **Game Engine:** Godot Engine (4.x - HTTPRequest node)
- **Backend:** PHP 8.x (REST API architecture, PDO, Prepared Statements)
- **Database:** MySQL / MariaDB (in XAMPP environment)
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Fetch API, Web Audio / Audio API)

---

## Requirements

- PHP 8.1+ with the `pdo_mysql` extension
- MySQL 5.7+ / MariaDB 10.4+
- Godot 4.x
- Any static file server for the dashboard (VS Code Live Server, `python3 -m http.server`, ...)

## 1. Database

```bash
mysql -u root -p < godot_log_viewer.sql
```

This creates the `godot_log_viewer` database and the `logs` table.

## 2. Backend

Copy the example environment file and adjust it if your MySQL credentials differ:

```bash
cp backend/.env-example backend/.env
```

| Key | Default | Meaning |
| --- | --- | --- |
| `DB_HOST` | `127.0.0.1` | MySQL host |
| `DB_NAME` | `godot_log_viewer` | Database name |
| `DB_USER` | `root` | MySQL user |
| `DB_PASS` | *(empty)* | MySQL password |
| `DB_CHARSET` | `utf8mb4` | Connection charset |

Start the API from the **project root** — the document root must be `backend/public`:

```bash
php -S localhost:8000 -t backend/public
```

Check it:

```bash
curl http://localhost:8000/api/logs
# {"status":"success","data":[]}
```

### Running under XAMPP instead

Drop the project into `htdocs` and point Apache at `backend/public`, or reach it through
the sub-directory URL — the bundled `.htaccess` rewrites everything to `index.php`, and
the router matches `/api/logs` at any depth:

```
http://localhost/godot-php-log-viewer/backend/public/api/logs
```

If you do this, set the same URL in **both** `frontend/js/config.js` (`API_BASE_URL`) and
`LogManager.gd` (`API_URL`).

## 3. Frontend

Serve the `frontend/` folder over HTTP (ES modules do not work from `file://`):

```bash
cd frontend
python3 -m http.server 5500
```

Open <http://localhost:5500>. If your API does not run on `http://localhost:8000`,
change `API_BASE_URL` in `frontend/js/config.js`. The poll interval lives in the same
file.

## 4. Godot

`LogManager.gd` mirrors the **entire Godot console** to the dashboard — every `print()`,
every `WARNING`, every `ERROR`, engine messages and script errors included, not just
calls you write yourself. It does this by tailing Godot's own log file, which is the only
way to see engine-generated output from GDScript.

**Step 1 — turn on file logging.** In *Project → Project Settings → Debug → File Logging*,
enable **Enable File Logging**, or add this to `project.godot`:

```ini
[debug]

file_logging/enable_file_logging=true
```

**Step 2 — register the autoload.** *Project → Project Settings → Globals → Autoload*,
path `res://LogManager.gd`, node name `LogManager`, enabled.

That is all. Start the game and the dashboard fills up on its own.

You can still log explicitly; these go to the Godot console like anything else and are
picked up by the same pipeline:

```gdscript
LogManager.info("Save file loaded")       # print()
LogManager.warning("Texture missing")     # push_warning()
LogManager.error("Null reference")        # push_error()
```

Warnings and errors carry the script and line Godot itself reports
(`res://boot.gd:6`); plain prints have no source, so their Script Path stays empty.

### How it works

- The log file (`user://logs/godot.log` by default) is polled every 0.2 s and only the
  bytes added since the last read are parsed.
- Lines are classified by Godot's own prefixes: `ERROR:`, `SCRIPT ERROR:`, `USER ERROR:`
  → **ERROR**; `WARNING:`, `USER WARNING:` → **WARNING**; everything else → **INFO**.
- A following `at: _ready (res://boot.gd:6)` line is folded into the entry above it as
  its Script Path.
- Entries are batched and POSTed as a JSON array, so a noisy startup is a couple of
  requests rather than a hundred.
- `LogManager`'s own console output is tagged and skipped, so a failing API cannot feed
  itself in a loop.
- Identical messages are sent once per run. A error repeating every frame inside
  `_process` produces one row, not thousands. Set `SKIP_REPEATS = false` at the top of
  the script if you want every occurrence.
- Settings live at the top of the script: `API_URL`, `POLL_SECONDS`, `MAX_BATCH`,
  `SKIP_REPEATS`.

**Note:** file logging is a debug-build feature. This is a development tool, so that is
the intended use — an exported release build will not produce a log file to tail.

## API

Base URL: `http://localhost:8000/api/logs`

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `GET` | `/api/logs` | All logs, newest first | `200` |
| `GET` | `/api/logs/{id}` | One log | `200` / `404` |
| `POST` | `/api/logs` | Create a log | `201` |
| `DELETE` | `/api/logs/{id}` | Delete one log | `200` / `404` |
| `DELETE` | `/api/logs` | Delete every log | `200` |

POST body — a single object:

```json
{
  "log_type": "INFO",
  "script_path": "res://boot.gd",
  "message": "Game started"
}
```

...or an array of them, which is what `LogManager` sends:

```json
[
  { "log_type": "INFO", "script_path": "", "message": "Godot Engine v4.6.stable" },
  { "log_type": "ERROR", "script_path": "res://boot.gd:7", "message": "Null reference" }
]
```

A batch returns `{"status":"success","inserted":2,"rejected":[]}`. Invalid rows are
reported in `rejected` and the valid ones are still stored.

`GET /api/logs` accepts:

| Param | Meaning |
| --- | --- |
| `limit` | Max rows, newest first (default 500, max 5000) |
| `type` | `ERROR`, `WARNING` or `INFO`; anything else is ignored |
| `q` | Substring match against message and script path |

The table loads 500 rows so it stays fast; **Export CSV** re-queries with the current
filter and search applied and no display cap, so the file contains every matching log,
not just the ones on screen.

`log_type` must be `ERROR`, `WARNING` or `INFO` (case-insensitive; stored uppercase).
`message` is required, `script_path` is optional and truncated to 255 characters.

Every response is JSON and has a `status` field of `success` or `error`; errors also
carry a `message`. CORS is open (`Access-Control-Allow-Origin: *`) so the dashboard can
live on a different port.

## Dashboard features

- Live polling every second, with an online/offline status dot
- Counters per severity
- Filter by severity, full-text search over message and script path
- Column show/hide, per-row and bulk delete
- CSV export (UTF-8 with BOM, so accented characters survive Excel)
- Alert sound: tick **Alert Sound** to enable the keyword box (it is greyed out until
  then), type a keyword such as `asset` and press **Set** or Enter. From then on any log
  arriving with that text in its message or script path plays a tone, within about a
  second of Godot printing it. Leave the keyword empty and it alerts on every new
  `ERROR` instead. It never fires for rows already on screen when the page loaded.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Dashboard shows "No logs found" and the status dot is red | The API is unreachable — check `API_BASE_URL` in `js/config.js` and that the PHP server is running |
| `{"status":"error","message":"Could not connect to database ..."}` | MySQL is not running, or `backend/.env` is wrong |
| Godot console shows `LogManager: ... could not reach ...` | The API is not listening on `API_URL` in `LogManager.gd` |
| Logs are stored but not shown | Open the browser console; a CORS or 404 error there names the failing URL |
| Status 500 and "CORS header missing" in the browser | The server died before PHP could send the headers. Run `curl -i http://localhost:8000/api/logs` to see the real error — the browser hides it. Under Apache it is usually `mod_rewrite` being off. |
| No alert sound | Browsers block audio until you interact with the page — click anywhere first. The alert only fires for logs that arrive after the dashboard loaded. |
