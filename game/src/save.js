// Save / load through localStorage (F5 saves, the menu offers resume).
import { CFG } from './config.js';

export function createSave(G) {
  function snapshot() {
    const p = G.player.state;
    const m = G.missions.state;
    return {
      version: 1,
      money: p.money, rp: p.rp, wanted: p.wanted,
      health: p.health, armour: p.armour,
      carHealth: p.carHealth, carColor: p.carColor, carColorName: p.carColorName,
      jobIndex: m.index, jobDone: m.done,
      x: p.x, z: p.z, heading: p.heading,
      carX: p.carX, carZ: p.carZ, carHeading: p.carHeading,
      hours: G.clock.hours,
      savedAt: new Date().toISOString(),
    };
  }

  function save() {
    try {
      window.localStorage.setItem(CFG.saveKey, JSON.stringify(snapshot()));
      G.hud?.flash('Progress tersimpan (F5).');
      return true;
    } catch {
      return false;
    }
  }

  function autosave() { try { window.localStorage.setItem(CFG.saveKey, JSON.stringify(snapshot())); } catch { /* storage off */ } }

  function load() {
    try {
      const raw = window.localStorage.getItem(CFG.saveKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function hasSave() { return load() !== null; }

  function apply(data) {
    const p = G.player.state;
    p.money = data.money; p.rp = data.rp; p.wanted = data.wanted;
    p.health = data.health; p.armour = data.armour;
    p.carHealth = data.carHealth;
    G.player.teleport(data.x, data.z, data.heading, false);
    p.carX = data.carX; p.carZ = data.carZ; p.carHeading = data.carHeading;
    if (data.carColor) G.player.repaint(data.carColor, data.carColorName || 'ORANYE');
    G.clock.hours = data.hours ?? 11;
    G.missions.startJob(Math.min(data.jobIndex ?? 0, CFG.jobs.length - 1));
  }

  function clear() { try { window.localStorage.removeItem(CFG.saveKey); } catch { /* noop */ } }

  return { save, autosave, load, hasSave, apply, clear };
}
