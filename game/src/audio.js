// All sound is synthesized with Web Audio — no audio files. Three radio stations
// (SURYA Island Pop, OMBO Sunset Synth, ARUNIKA TALK), an engine hum that follows
// speed, a two-tone APD siren, and UI blips. Everything is lazy: the AudioContext
// starts on the first user gesture.
import { CFG } from './config.js';

export function createAudio() {
  let ctx = null;
  let master = null;
  let radioNodes = null;
  let engineOsc = null, engineGain = null;
  let sirenOsc = null, sirenGain = null;
  let station = 0;
  let radioOn = true;
  let talkTimer = 0;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function resume() { if (ensure() && ctx.state === 'suspended') ctx.resume(); }

  function stopRadio() {
    if (radioNodes) {
      try { radioNodes.stop(); } catch { /* already stopped */ }
      radioNodes = null;
    }
  }

  // A tiny step sequencer: a bass line and a plucked lead over the station root.
  function startRadio() {
    if (!ensure() || !radioOn) return;
    stopRadio();
    const st = CFG.radio[station];
    if (st.bpm === 0) return; // talk station: no music, just a jingle now and then
    const beat = 60 / st.bpm;
    const bass = ctx.createOscillator(); bass.type = 'triangle';
    const lead = ctx.createOscillator(); lead.type = 'square';
    const bassGain = ctx.createGain(); bassGain.gain.value = 0.16;
    const leadGain = ctx.createGain(); leadGain.gain.value = 0.05;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1400;
    bass.connect(bassGain); lead.connect(leadGain);
    bassGain.connect(filter); leadGain.connect(filter);
    filter.connect(master);
    const scale = [1, 1.189, 1.335, 1.498, 1.782, 2];
    const melody = [0, 2, 4, 2, 5, 4, 2, 0, 3, 2, 0, -1];
    let step = 0;
    const timer = setInterval(() => {
      if (!ctx || radioNodes?.timer !== timer) { clearInterval(timer); return; }
      const t = ctx.currentTime + 0.02;
      const root = st.root;
      bass.frequency.setValueAtTime(root * (step % 4 === 0 ? 1 : step % 4 === 2 ? 1.498 : 1.335), t);
      const note = melody[step % melody.length];
      lead.frequency.setValueAtTime(root * 2 * scale[((note % 6) + 6) % 6], t);
      step += 1;
    }, beat * 500);
    bass.start(); lead.start();
    radioNodes = { stop() { clearInterval(timer); try { bass.stop(); lead.stop(); } catch { /* noop */ } }, timer };
  }

  function nextStation() {
    station = (station + 1) % CFG.radio.length;
    startRadio();
    return CFG.radio[station];
  }

  function currentStation() { return CFG.radio[station]; }

  function setEngine(speed01, on) {
    if (!ensure()) return;
    if (!engineOsc) {
      engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth';
      engineGain = ctx.createGain(); engineGain.gain.value = 0;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
      engineOsc.connect(f); f.connect(engineGain); engineGain.connect(master);
      engineOsc.start();
    }
    const t = ctx.currentTime;
    engineOsc.frequency.setTargetAtTime(55 + speed01 * 130, t, 0.08);
    engineGain.gain.setTargetAtTime(on ? 0.03 + speed01 * 0.05 : 0, t, 0.1);
  }

  function setSiren(on) {
    if (!ensure()) return;
    if (on && !sirenOsc) {
      sirenOsc = ctx.createOscillator(); sirenOsc.type = 'sine';
      sirenGain = ctx.createGain(); sirenGain.gain.value = 0.035;
      sirenOsc.connect(sirenGain); sirenGain.connect(master);
      sirenOsc.start();
      let hi = true;
      const iv = setInterval(() => {
        if (!sirenOsc) { clearInterval(iv); return; }
        sirenOsc.frequency.setValueAtTime(hi ? 960 : 720, ctx.currentTime);
        hi = !hi;
      }, 420);
      sirenOsc._iv = iv;
    } else if (!on && sirenOsc) {
      clearInterval(sirenOsc._iv);
      try { sirenOsc.stop(); } catch { /* noop */ }
      sirenOsc = null;
    }
  }

  function blip(freq, dur) {
    if (!ensure()) return;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq || 440;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.1));
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + (dur || 0.1));
  }

  function thud() {
    if (!ensure()) return;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    o.connect(g); g.connect(master);
    o.start(); o.stop(ctx.currentTime + 0.2);
  }

  function fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => blip(f, 0.22), i * 110);
    });
  }

  function fail() {
    [392, 330, 262].forEach((f, i) => {
      setTimeout(() => blip(f, 0.25), i * 140);
    });
  }

  function update(dt) {
    // Talk station: a short spoken-style jingle every ~20 s (a blip pattern).
    if (CFG.radio[station].bpm === 0 && ctx) {
      talkTimer += dt;
      if (talkTimer > 20) { talkTimer = 0; blip(700, 0.06); setTimeout(() => blip(500, 0.06), 120); }
    }
  }

  return {
    resume, startRadio, stopRadio, nextStation, currentStation,
    setEngine, setSiren, blip, thud, fanfare, fail, update,
    get station() { return station; },
    set radio(v) { radioOn = v; if (!v) stopRadio(); else startRadio(); },
  };
}
