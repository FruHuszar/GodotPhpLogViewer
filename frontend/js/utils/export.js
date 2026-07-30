const HEADERS = ["ID", "Time", "Type", "Script Path", "Message"];

export function exportToCSV(logs, filename = "godot_logs.csv") {
  const rows = logs.map((log) =>
    [log.id, log.created_at, log.log_type, log.script_path, log.message]
      .map(field)
      .join(","),
  );

  download([HEADERS.join(","), ...rows].join("\n"), filename);
}

function field(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function download(content, filename) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" }),
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.append(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
