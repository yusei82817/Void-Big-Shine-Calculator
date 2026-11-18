const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class SonoraAudioEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.filter = null;
    this.waveform = "sine";
    this.attack = 0.08;
    this.release = 0.65;
    this.cutoff = 4800;
    this.volume = 0.65;
    this.activeVoices = new Set();
    this.maxVoices = 24;
  }

  async init() {
    if (this.context) {
      if (this.context.state === "suspended") await this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("このブラウザはWeb Audio APIに対応していません。");
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.filter = this.context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = this.cutoff;
    this.filter.Q.value = 0.7;
    this.master.gain.value = this.volume;
    this.filter.connect(this.master);
    this.master.connect(this.context.destination);
    if (this.context.state === "suspended") await this.context.resume();
  }

  setParameters({ waveform, attack, release, cutoff, volume } = {}) {
    if (waveform) this.waveform = waveform;
    if (Number.isFinite(attack)) this.attack = clamp(attack, 0.005, 3);
    if (Number.isFinite(release)) this.release = clamp(release, 0.02, 5);
    if (Number.isFinite(cutoff)) {
      this.cutoff = clamp(cutoff, 80, 18000);
      if (this.filter && this.context) this.filter.frequency.setTargetAtTime(this.cutoff, this.context.currentTime, 0.025);
    }
    if (Number.isFinite(volume)) {
      this.volume = clamp(volume, 0, 1);
      if (this.master && this.context) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.025);
    }
  }

  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  noteOn(midi, velocity = 0.75, duration = 0.45, options = {}) {
    if (!this.context || !this.filter) return;
    const now = Math.max(this.context.currentTime, options.when ?? 0);
    if (this.activeVoices.size >= this.maxVoices) {
      const oldest = this.activeVoices.values().next().value;
      if (oldest) this.releaseVoice(oldest, now, 0.04);
    }
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const voiceFilter = this.context.createBiquadFilter();
    const attack = options.attack ?? this.attack;
    const release = options.release ?? this.release;
    const peak = clamp(velocity, 0, 1) * 0.22;
    osc.type = options.waveform || this.waveform;
    osc.frequency.setValueAtTime(this.midiToFrequency(midi), now);
    osc.detune.setValueAtTime(options.detune || 0, now);
    voiceFilter.type = "lowpass";
    voiceFilter.frequency.setValueAtTime(options.cutoff || this.cutoff, now);
    voiceFilter.Q.value = 0.75;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + Math.max(0.008, attack));
    gain.gain.setTargetAtTime(peak * 0.72, now + Math.max(0.008, attack), 0.09);
    osc.connect(voiceFilter);
    voiceFilter.connect(gain);
    gain.connect(this.filter);
    const voice = { osc, gain, voiceFilter, released: false, release };
    this.activeVoices.add(voice);
    osc.start(now);
    const noteDuration = Math.max(0.06, duration);
    this.releaseVoice(voice, now + noteDuration, release);
    return voice;
  }

  releaseVoice(voice, when = this.context?.currentTime ?? 0, release = this.release) {
    if (!voice || voice.released || !this.context) return;
    voice.released = true;
    const end = Math.max(this.context.currentTime, when);
    const gain = voice.gain.gain;
    const current = Math.max(0.0001, gain.value);
    gain.cancelScheduledValues(end);
    gain.setValueAtTime(current, end);
    gain.exponentialRampToValueAtTime(0.0001, end + Math.max(0.02, release));
    try { voice.osc.stop(end + Math.max(0.03, release) + 0.02); } catch {}
    voice.osc.onended = () => {
      voice.osc.disconnect();
      voice.voiceFilter.disconnect();
      voice.gain.disconnect();
      this.activeVoices.delete(voice);
    };
  }

  async playTestNote(midi = 60) {
    await this.init();
    this.noteOn(midi, 0.8, 0.65);
  }

  stopAll() {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const voice of [...this.activeVoices]) this.releaseVoice(voice, now, 0.045);
  }

  async close() {
    this.stopAll();
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.master = null;
      this.filter = null;
      this.activeVoices.clear();
    }
  }
}
