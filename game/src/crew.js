// The crew: Sari (SWAP PLATES, -1 wanted star), Bayu (QUICK FIX, repair the car),
// Lia (EYES OUT, all police on the minimap for 25 s). One shared 30 s cooldown.
import { CFG } from './config.js';

export function createCrew(G) {
  const state = {
    cooldown: 0,
    liaTimer: 0,
    lastUsed: '',
  };

  function ready() { return state.cooldown <= 0; }

  function use(id) {
    if (!ready()) {
      G.hud?.flash(`Crew masih cooldown — ${Math.ceil(state.cooldown)} dtk lagi.`);
      return false;
    }
    const p = G.player.state;
    const crew = CFG.crew.find((c) => c.id === id);
    if (!crew) return false;
    state.cooldown = CFG.crewCooldown;
    state.lastUsed = crew.name;
    if (id === 'sari') {
      if (p.wanted > 0) {
        p.wanted -= 1;
        G.hud?.say('SARI', 'Plat diganti. Satu bintang hilang — jalan terus!');
      } else {
        G.hud?.say('SARI', 'Kamu lagi bersih, Reza. Plat tetap kusiapkan.');
      }
    } else if (id === 'bayu') {
      p.carHealth = 100; p.wrecked = false;
      G.hud?.say('BAYU', 'Mobil mulus lagi, 100%. Kayak baru keluar bengkel.');
    } else if (id === 'lia') {
      state.liaTimer = CFG.liaDuration;
      G.hud?.say('LIA', 'Mata-mata di mana-mana. Semua APD kelihatan di peta 25 detik.');
    }
    G.audio?.blip(520, 0.1);
    return true;
  }

  function update(dt) {
    if (state.cooldown > 0) state.cooldown -= dt;
    if (state.liaTimer > 0) state.liaTimer -= dt;
  }

  return { state, use, update, ready };
}
