import { API_BASE_URL, MAX_ROWS } from "./config.js";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && payload.message) || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export async function fetchLogs({ limit = MAX_ROWS, type = "", search = "" } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  if (type && type !== "ALL") params.set("type", type);
  if (search) params.set("q", search);

  const payload = await request(`${API_BASE_URL}?${params.toString()}`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function deleteLogById(id) {
  const payload = await request(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  return payload?.status === "success";
}

export async function deleteAllLogs() {
  const payload = await request(API_BASE_URL, { method: "DELETE" });
  return payload?.status === "success";
}
