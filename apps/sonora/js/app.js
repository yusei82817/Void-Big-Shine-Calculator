import { SonoraAudioEngine } from "./audio-engine.js";
import { loadProject, saveProject } from "./project-store.js";

const audio = new SonoraAudioEngine();
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const patterns = {
  pad:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
  bass: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
  bell: [0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,1],
  lead: [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0]
};
const trackNotes = { pad: 48, bass: 36, bell: 72, lead: 64 };
const state = { playing: false, step: 0, timer: null, nextStepTime: 0, waveform: "sine", tempo: 112, patterns };
const status = (message) => { $("#playback-status").textContent = message; };
const saveStatus = (message) => { $("#save-state").lastChild.textContent = " " + message; };

function renderSequencer() {
  const ruler = $("#step-ruler");
  ruler.innerHTML = "";
  for (let i = 0; i < 16; i++) {
    const mark = document.createElement("span");
    mark.textContent = String(i + 1).padStart(2, "0");
    ruler.append(mark);
  }
  $$(".step-grid").forEach(grid => {
    const track = grid.dataset.pattern;
    grid.innerHTML = "";
    patterns[track].forEach((active, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "step" + (active ? " active" : "");
      button.setAttribute("aria-label", track + " step " + (index + 1));
      button.setAttribute("aria-pressed", String(Boolean(active)));
      button.addEventListener("click", () => {
        patterns[track][index] = patterns[track][index] ? 0 : 1;
        button.classList.toggle("active", Boolean(patterns[track][index]));
        button.setAttribute("aria-pressed", String(Boolean(patterns[track][index])));
      });
      grid.append(button);
    });
  });
}

function markStep(step) {
  $(".step-grid").forEach(grid => {
    [...grid.children].forEach((button, index) => {
      button.classList.toggle("playing", index === step && state.playing);
    });
  });
  $("#step-display").textContent = "BAR 01 · BEAT " + String(Math.floor(step / 4) + 1).padStart(2, "0");
}

function scheduleStep(step, when) {
  for (const [track, pattern] of Object.entries(patterns)) {
    if (!pattern[step]) continue;
    const base = trackNotes[track];
    const note = track === "pad" ? base + [0, 7, 12, 7][Math.floor(step / 4)] :
      track === "bell" ? base + [0, 4, 7, 11, 12][step % 5] :
      track === "lead" ? base + [0, 3, 7, 10, 7, 3, 2, 5][step % 8] : base + (step % 8 === 6 ? 7 : 0);
    const velocity = track === "pad" ? 0.36 : track === "bass" ? 0.72 : track === "bell" ? 0.48 : 0.55;
    const duration = track === "pad" ? 0.43 : track === "bass" ? 0.19 : track === "bell" ? 0.22 : 0.16;
    audio.noteOn(note, velocity, duration, { when, waveform: track === "bass" ? "triangle" : track === "bell" ? "sine" : state.waveform });
  }
}

function scheduler() {
  if (!state.playing || !audio.context) return;
  const lookAhead = 0.12;
  const secondsPerBeat = 60 / state.tempo;
  const stepDuration = secondsPerBeat / 4;
  while (state.nextStepTime < audio.context.currentTime + lookAhead) {
    const scheduledStep = state.step;
    const scheduledAt = state.nextStepTime;
    scheduleStep(scheduledStep, scheduledAt);
    const delay = Math.max(0, (scheduledAt - audio.context.currentTime) * 1000);
    window.setTimeout(() => {
      if (state.playing) markStep(scheduledStep);
    }, delay);
    state.step = (state.step + 1) % 16;
    state.nextStepTime += stepDuration;
  }
}

async function startPlayback() {
  try {
    await audio.init();
    if (state.playing) return;
    state.playing = true;
    state.step = 0;
    state.nextStepTime = audio.context.currentTime + 0.06;
    $("#play-button").classList.add("is-playing");
    $("#play-button").setAttribute("aria-label", "一時停止");
    $(".play-glyph").textContent = "Ⅱ";
    status("PLAYING · LIVE AUDIO");
    scheduler();
    state.timer = window.setInterval(scheduler, 25);
  } catch (error) {
    status(error.message || "AUDIO INITIALIZATION FAILED");
  }
}

function stopPlayback() {
  state.playing = false;
  if (state.timer) window.clearInterval(state.timer);
  state.timer = null;
  audio.stopAll();
  $("#play-button").classList.remove("is-playing");
  $("#play-button").setAttribute("aria-label", "再生");
  $(".play-glyph").textContent = "▶";
  status("READY TO CREATE");
  $$(".step.playing").forEach(button => button.classList.remove("playing"));
  $("#step-display").textContent = "BAR 01 · BEAT 01";
}

function getProject() {
  return {
    name: "New composition",
    tempo: state.tempo,
    waveform: state.waveform,
    patterns: structuredClone(patterns),
    synth: {
      attack: Number($("#attack").value),
      release: Number($("#release").value),
      cutoff: Number($("#cutoff").value),
      volume: Number($("#volume").value)
    }
  };
}

function applyProject(project) {
  if (!project) return;
  if (Number.isFinite(project.tempo)) {
    state.tempo = Math.min(240, Math.max(40, project.tempo));
    $("#tempo").value = state.tempo;
  }
  if (project.patterns) {
    for (const track of Object.keys(patterns)) {
      if (Array.isArray(project.patterns[track]) && project.patterns[track].length === 16) {
        patterns[track] = project.patterns[track].map(value => value ? 1 : 0);
      }
    }
  }
  if (project.waveform && ["sine", "triangle", "sawtooth", "square"].includes(project.waveform)) {
    state.waveform = project.waveform;
    $$(".wave-option").forEach(button => button.classList.toggle("active", button.dataset.wave === state.waveform));
  }
  if (project.synth) {
    for (const key of ["attack", "release", "cutoff", "volume"]) {
      const input = $("#" + key);
      if (Number.isFinite(project.synth[key])) input.value = project.synth[key];
    }
  }
  syncSynthControls();
  renderSequencer();
}

function syncSynthControls() {
  const params = {
    waveform: state.waveform,
    attack: Number($("#attack").value),
    release: Number($("#release").value),
    cutoff: Number($("#cutoff").value),
    volume: Number($("#volume").value)
  };
  audio.setParameters(params);
  $("#attack-value").textContent = params.attack.toFixed(2) + " s";
  $("#release-value").textContent = params.release.toFixed(2) + " s";
  $("#cutoff-value").textContent = params.cutoff >= 1000 ? (params.cutoff / 1000).toFixed(1) + " kHz" : params.cutoff + " Hz";
  $("#volume-value").textContent = Math.round(params.volume * 100) + "%";
}

function buildKeyboard() {
  const keyboard = $("#keyboard");
  const whiteNotes = [0,2,4,5,7,9,11,12,14,16,17,19,21,23];
  const blackNotes = [{n:1,p:1},{n:3,p:2},{n:6,p:4},{n:8,p:5},{n:10,p:6},{n:13,p:8},{n:15,p:9},{n:18,p:11},{n:20,p:12},{n:22,p:13}];
  whiteNotes.forEach((offset, index) => {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "white-key";
    key.setAttribute("aria-label", "MIDI note " + (48 + offset));
    const label = document.createElement("span");
    if ([0,2,4,5,7,9,11].includes(offset % 12)) label.textContent = offset % 12 === 0 ? "C" + (3 + Math.floor(offset / 12)) : "";
    key.append(label);
    const play = async () => { await audio.init(); audio.noteOn(48 + offset, 0.72, 0.45); key.classList.add("pressed"); window.setTimeout(() => key.classList.remove("pressed"), 180); };
    key.addEventListener("pointerdown", play);
    keyboard.append(key);
  });
  blackNotes.forEach(({ n, p }) => {
    const key = document.createElement("button");
    key.type = "button";
    key.className = "black-key";
    key.style.left = ((p + 0.5) / 14 * 100) + "%";
    key.setAttribute("aria-label", "MIDI note " + (48 + n));
    key.addEventListener("pointerdown", async () => {
      await audio.init();
      audio.noteOn(48 + n, 0.72, 0.45);
      key.classList.add("pressed");
      window.setTimeout(() => key.classList.remove("pressed"), 180);
    });
    keyboard.append(key);
  });
}

$("#play-button").addEventListener("click", () => state.playing ? stopPlayback() : startPlayback());
$("#stop-button").addEventListener("click", stopPlayback);
$("#tempo").addEventListener("change", event => {
  state.tempo = Math.min(240, Math.max(40, Number(event.target.value) || 112));
  event.target.value = state.tempo;
});
$$(".wave-option").forEach(button => button.addEventListener("click", () => {
  state.waveform = button.dataset.wave;
  $$(".wave-option").forEach(option => option.classList.toggle("active", option === button));
  syncSynthControls();
}));
["attack", "release", "cutoff", "volume"].forEach(id => $("#" + id).addEventListener("input", syncSynthControls));
$("#preview-button").addEventListener("click", async () => {
  try { await audio.playTestNote(60); }
  catch (error) { status(error.message || "AUDIO ERROR"); }
});
$("#save-button").addEventListener("click", async () => {
  try {
    await saveProject(getProject());
    saveStatus("PROJECT SAVED LOCALLY");
  } catch (error) { saveStatus(error.message || "SAVE FAILED"); }
});
$("#export-button").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(getProject(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sonora-project.json";
  link.click();
  URL.revokeObjectURL(url);
  saveStatus("JSON PROJECT EXPORTED");
});

renderSequencer();
buildKeyboard();
syncSynthControls();
loadProject().then(project => {
  if (project) {
    applyProject(project);
    saveStatus("LAST PROJECT RESTORED");
  }
}).catch(() => saveStatus("LOCAL STORAGE UNAVAILABLE"));
