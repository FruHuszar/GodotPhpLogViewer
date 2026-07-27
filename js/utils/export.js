export function exportToCSV(logs, filename = "godot_logs.csv") {
  if (!logs || logs.length === 0) {
    alert("No logs available to export.");
    return;
  }

  const headers = ["ID", "Time", "Type", "Script Path", "Message"];

  const rows = logs.map((log) => [
    `"${formatCSVField(log.id)}"`,
    `"${formatCSVField(log.created_at)}"`,
    `"${formatCSVField(log.log_type)}"`,
    `"${formatCSVField(log.script_path)}"`,
    `"${formatCSVField(log.message)}"`,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function formatCSVField(field) {
  if (field === null || field === undefined) return "";
  return String(field).replace(/"/g, '""');
}
