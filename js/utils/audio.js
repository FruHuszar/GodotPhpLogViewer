import {
  isAudioEnabled,
  getAudioKeyword,
  getLastSeenLogId,
  setLastSeenLogId,
} from "../state.js";

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function playAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

export function checkAndPlayAudioAlert(logs) {
  const previousId = getLastSeenLogId();
  const newest = highestId(logs);

  setLastSeenLogId(newest);

  if (previousId === null || !isAudioEnabled()) {
    return;
  }

  const arrivals = logs.filter((log) => Number(log.id) > previousId);

  if (arrivals.length === 0) {
    return;
  }

  if (arrivals.some(shouldAlert)) {
    playAlertSound();
  }
}

function shouldAlert(log) {
  const keyword = getAudioKeyword();

  if (!keyword) {
    return String(log.log_type || "").toUpperCase() === "ERROR";
  }

  const message = (log.message || "").toLowerCase();
  const script = (log.script_path || "").toLowerCase();

  return message.includes(keyword) || script.includes(keyword);
}

function highestId(logs) {
  return logs.reduce((highest, log) => Math.max(highest, Number(log.id) || 0), 0);
}
