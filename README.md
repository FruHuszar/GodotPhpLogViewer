# Godot Log Viewer

A website that mirrors your Godot console, so a real `ERROR` doesn't get lost among fifty `WARNING` lines.
<br>Comes with error sounds.

> **Note:** This project is not hosted online. Use it locally with the steps below.
> <br>Live preview (frontend only): https://fruhuszar.github.io/GodotPhpLogViewer/

---

## What you can do with it

- **See every console line in the browser:** your own `print()` calls, engine messages, script errors, warnings.
- **Filter by severity:** view `ERROR`, `WARNING`, `INFO`, or all of them with one click.
- **Play sound on error:** tick **Alert sound** to play an audio notification on incoming logs. It uses a default sound effect (the iconic FAAH), but you can replace `alert.wav` or `alert.mp3` in `frontend/audio/` for your own notification sound.
  Type a keyword into the search bar and click **Set** to trigger alerts only for matching messages (such as `asset`).
- **Export to CSV:** Select rows and download them in csv format, to easily copy only the important messages.
- **Search, clean up, hide/show columns:** Search for specific messages or filepaths, toggle off any columns you don't need, delete individual rows, selected rows, or reset the whole database.
- **Know if it is live:** the dot next to the title is blue when connected, pulsing green while logs arrive, and red when the backend can't be reached.

---

## How to use

### First time setup

1. **Download the project**  
   Click **Code** on GitHub and select **Download ZIP**, then unzip it anywhere on your computer.

2. **Add the files to your Godot project**  
   Copy `godot_root/LogManager.gd` (and `boot.gd` if you want example errors) into your Godot project folder.

   In Godot:
   - Go to **Project Settings -> Globals -> Autoload**, pick `LogManager.gd`, and click **Add**. This makes it run automatically with your game, so logging works without calling it manually.
   - Go to **Project Settings -> Debug -> File Logging** and enable **File Logging**. This is required for Godot to capture internal engine messages.

3. **Make sure an SQL server is installed**  
   If you don't have one, download an SQL server app, for example XAMPP.

4. **Run your SQL server**

   **Linux**

   ```bash
   sudo systemctl start mariadb
   ```

   **Windows**  
   Start MySQL (for example) from the XAMPP Control Panel.

5. **Open a terminal in the project root** (the folder containing `backend/` and `frontend/`) and set up the database.

   **Linux**

   ```bash
   mysql -u root -p < database_empty/godot_log_viewer.sql
   cp backend/.env-example backend/.env
   ```

   **Windows (CMD)**

   ```bash
   copy backend\.env-example backend\.env
   ```

6. **Start the backend**

   ```bash
   php -S localhost:8000 -t backend/public
   ```

   Leave this terminal open.

7. **Start the dashboard**

   In a second terminal:

   ```bash
   php -S localhost:5500 -t frontend
   ```

   Leave this terminal open.

Open `http://localhost:5500` in your browser. The status dot should turn blue.

---

### After setting up

Steps 1 to 5 only needed to be done once. For daily development:

1. Make sure your SQL server is running.

   **Linux**

   ```bash
   sudo systemctl start mariadb
   ```

   **Windows**  
   Start MySQL (for example) via the XAMPP Control Panel.

2. Terminal 1, from the project folder:

   ```bash
   php -S localhost:8000 -t backend/public
   ```

3. Terminal 2, from the project folder:

   ```bash
   php -S localhost:5500 -t frontend
   ```

4. Open `http://localhost:5500` in your browser and press play in Godot.

---

## Good to know

- **Ports:** to change ports, update `API_URL` in `frontend/js/index.js` and `API_URL` in `LogManager.gd`.
- **Repeated messages:** identical errors repeated during frame updates are sent once per run by default. Set `SKIP_REPEATS = false` at the top of `LogManager.gd` to record every occurrence.
- **Sound throttling:** alert sounds trigger at most once every 1.5 seconds to prevent audio stacking during error floods.
- **Export builds:** file logging is active in debug builds only. Exported release builds don't output log files.
- **Table limits:** the dashboard loads the newest 500 rows to keep rendering responsive.
- **Apache / XAMPP setup:** place the project into `htdocs` and access `http://localhost/godot-php-log-viewer/backend/public/api/logs`. The `.htaccess` file handles URL rewriting.

---

## Troubleshooting

| Symptom                             | Cause                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Red dot, no logs                    | The backend isn't running, or `API_URL` in `frontend/js/index.js` points to the wrong URL.                          |
| Could not connect to database       | MySQL isn't running, or connection settings in `backend/.env` are incorrect.                                              |
| Godot prints connection error       | Backend isn't listening on the address configured in `LogManager.gd`.                                                     |
| Dot stays blue while game runs      | No new logs arrived in the last 8 seconds. The engine is running quietly.                                                 |
| Logs stored but not shown           | Check the browser developer console for CORS or 404 errors.                                                               |
| Status 500 and missing CORS headers | The server hit an error before PHP returned headers. Run `curl -i http://localhost:8000/api/logs` to see the exact error. |
| No alert sound                      | Audio file missing in `frontend/audio/`, or the browser requires a page click before allowing audio playback.             |

---

## Built with

- Engine: Godot 4.x
- Backend: PHP 8.1+ (PDO with prepared statements)
- Database: MySQL / MariaDB
- Frontend: Vanilla HTML5, CSS3, JavaScript (ES6+, zero build step / frameworks)
