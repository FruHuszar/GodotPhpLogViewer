extends Node

const API_URL: String = "http://localhost:8000/api/logs"
const HEADERS: PackedStringArray = ["Content-Type: application/json", "Accept: application/json"]
const DEFAULT_LOG_PATH: String = "user://logs/godot.log"
const SELF_TAG: String = "LogManager:"
const POLL_SECONDS: float = 0.2
const REQUEST_TIMEOUT: float = 5.0
const SKIP_REPEATS: bool = true
const MAX_REMEMBERED: int = 5000
const MAX_QUEUE: int = 2000
const MAX_BATCH: int = 200
const MISSING_FILE_GRACE: int = 15

var _log_path: String = DEFAULT_LOG_PATH
var _offset: int = 0
var _carry: String = ""
var _queue: Array[Dictionary] = []
var _sending: bool = false
var _seen: Dictionary = {}
var _missing_polls: int = 0
var _warned_about_logging: bool = false


func _ready() -> void:
	_log_path = str(ProjectSettings.get_setting("debug/file_logging/log_path", DEFAULT_LOG_PATH))

	var timer := Timer.new()
	timer.wait_time = POLL_SECONDS
	timer.autostart = true
	timer.timeout.connect(_on_tick)
	add_child(timer)


func info(message: String) -> void:
	print(message)


func warning(message: String) -> void:
	push_warning(message)


func error(message: String) -> void:
	push_error(message)


func _on_tick() -> void:
	_read_new_lines()
	_flush()
	_age_queue()


func _read_new_lines() -> void:
	if not FileAccess.file_exists(_log_path):
		_missing_polls += 1
		if _missing_polls == MISSING_FILE_GRACE and not _warned_about_logging:
			_warned_about_logging = true
			print_rich("[color=orange]%s no log file at %s. Enable it with debug/file_logging/enable_file_logging = true in Project Settings.[/color]"
				% [SELF_TAG, _log_path])
		return

	_missing_polls = 0

	var file: FileAccess = FileAccess.open(_log_path, FileAccess.READ)
	if file == null:
		return

	var length: int = file.get_length()

	if length < _offset:
		_offset = 0
		_carry = ""

	if length == _offset:
		file.close()
		return

	file.seek(_offset)
	var chunk: String = file.get_buffer(length - _offset).get_string_from_utf8()
	_offset = length
	file.close()

	var text: String = _carry + chunk
	var lines: PackedStringArray = text.split("\n")

	_carry = ""
	if not text.ends_with("\n"):
		_carry = lines[lines.size() - 1]
		lines.remove_at(lines.size() - 1)

	for line: String in lines:
		_consume(line)


func _consume(raw_line: String) -> void:
	var line: String = raw_line.strip_edges()

	if line.is_empty() or line.contains(SELF_TAG):
		return

	if line.begins_with("at:") and not _queue.is_empty():
		_queue[_queue.size() - 1]["script_path"] = _extract_source(line)
		return

	_enqueue(_severity_of(line), _strip_prefix(line))


func _severity_of(line: String) -> String:
	var upper: String = line.to_upper()

	if upper.begins_with("ERROR:") or upper.begins_with("SCRIPT ERROR:") \
			or upper.begins_with("USER ERROR:") or upper.begins_with("USER SCRIPT ERROR:"):
		return "ERROR"

	if upper.begins_with("WARNING:") or upper.begins_with("USER WARNING:"):
		return "WARNING"

	return "INFO"


func _strip_prefix(line: String) -> String:
	var separator: int = line.find(":")

	if separator == -1:
		return line

	var prefix: String = line.substr(0, separator).to_upper()

	if prefix in ["ERROR", "WARNING", "SCRIPT ERROR", "USER ERROR", "USER WARNING", "USER SCRIPT ERROR"]:
		return line.substr(separator + 1).strip_edges()

	return line


func _extract_source(line: String) -> String:
	var opening: int = line.rfind("(")
	var closing: int = line.rfind(")")

	if opening != -1 and closing > opening:
		return line.substr(opening + 1, closing - opening - 1)

	return line.substr(3).strip_edges()


func _enqueue(log_type: String, message: String) -> void:
	if message.is_empty():
		return

	if SKIP_REPEATS:
		var key: String = "%s|%s" % [log_type, message]
		if _seen.has(key):
			return
		if _seen.size() >= MAX_REMEMBERED:
			_seen.clear()
		_seen[key] = true

	if _queue.size() >= MAX_QUEUE:
		_queue.pop_front()

	_queue.append({
		"log_type": log_type,
		"script_path": "",
		"message": message,
		"ticks": 0,
	})


func _age_queue() -> void:
	for entry: Dictionary in _queue:
		entry["ticks"] = int(entry["ticks"]) + 1


func _flush() -> void:
	if _sending or _queue.is_empty():
		return

	var batch: Array[Dictionary] = []
	while not _queue.is_empty() and batch.size() < MAX_BATCH:
		var entry: Dictionary = _queue[0]
		if int(entry["ticks"]) < 1:
			break
		_queue.pop_front()
		batch.append({
			"log_type": entry["log_type"],
			"script_path": entry["script_path"],
			"message": entry["message"],
		})

	if batch.is_empty():
		return

	_sending = true

	var request := HTTPRequest.new()
	request.timeout = REQUEST_TIMEOUT
	add_child(request)
	request.request_completed.connect(_on_request_completed.bind(request, batch))

	var error_code: int = request.request(
		API_URL, HEADERS, HTTPClient.METHOD_POST, JSON.stringify(batch))

	if error_code != OK:
		_sending = false
		request.queue_free()
		_report("could not reach %s (error %d)" % [API_URL, error_code])


func _on_request_completed(
		result: int,
		response_code: int,
		_headers: PackedStringArray,
		body: PackedByteArray,
		request: HTTPRequest,
		batch: Array) -> void:
	request.queue_free()
	_sending = false

	if result != HTTPRequest.RESULT_SUCCESS:
		_report("%d entries dropped, %s unreachable (result %d)" % [batch.size(), API_URL, result])
		return

	if response_code != 201:
		_report("%d entries rejected with HTTP %d: %s"
			% [batch.size(), response_code, body.get_string_from_utf8()])


func _report(message: String) -> void:
	print_rich("[color=orange]%s %s[/color]" % [SELF_TAG, message])
