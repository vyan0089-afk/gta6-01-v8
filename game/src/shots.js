// Screenshot staging behind ?shot=drive|foot|garage|race (with &auto=1 the game
// keeps running so Playwright can hold W). Each scene stages the real game —
// real HUD, real police, real heli — at a fixed place, job and time of day.
import { CFG } from './config.js';
import { makeCarMesh } from './world.js';

export function stageShot(name, G) {
  const p = G.player.state;
  // Clear any previous staging props.
  if (G.shotRival) { G.scene.remove(G.shotRival); G.shotRival = null; }
  G.police.clearAll();
  G.clock.dusk = false;

  if (name === 'drive') {
    G.clock.hours = 16;
    G.player.teleport(272, -40, Math.PI, true);
    p.carSpeed = 30; // ~108 KM/H on the speedometer despite slow headless frames
    p.carHealth = 100; p.wrecked = false; // the cover car is showroom-fresh
    p.wanted = 3;
    p.money = 1250; p.rp = 620;
    G.missions.startJob(1); // Kurir Pantai
    G.missions.state.timer = 48;
    // Red rival ahead on the boulevard.
    const rival = makeCarMesh(0xd63031);
    rival.position.set(272, 0, -90);
    rival.rotation.y = Math.PI;
    G.scene.add(rival);
    G.shotRival = rival;
    // Heli starts in front of the player (angle PI = ahead), slightly right.
    G.police.setHeliAngle(Math.PI - 0.4);
    G.police.update(0.05);
    G.police.update(0.05);
  } else if (name === 'garage') {
    G.clock.hours = 18.33;
    G.clock.dusk = true;
    // Face the garage (it sits at z=34, north of the player): heading 0 keeps
    // the chase camera south of the garage instead of inside it.
    G.player.teleport(-34, 20, 0, true);
    p.wanted = 0;
    p.money = 850; p.rp = 350;
    G.missions.startJob(0); // Sopir Baru
    G.player.repaint(0x1e6fd9, 'BIRU'); // garage repaint works: the GT turns blue
  } else if (name === 'race') {
    G.clock.hours = 18.75;
    G.clock.dusk = true;
    G.player.teleport(272, 60, Math.PI, true);
    p.carSpeed = 30; // fast enough for the speedometer to read after re-staging
    p.wanted = 1;
    p.money = 3100; p.rp = 2900;
    G.missions.startJob(7); // Balap Jalanan
  } else {
    // foot (default)
    G.clock.hours = 11.5;
    G.player.teleport(-100, -100, 0.6, false);
    p.wanted = 0;
    p.money = 250; p.rp = 0;
    G.missions.startJob(0); // Sopir Baru
  }
  G.render.setTimeOfDay(G.clock.hours, G.clock.dusk);
  G.hud.clearTransient();
  G.hud.say('SARI', CFG.jobs[G.missions.state.index].brief);
  window.__shotReady = true;
  // Re-staging (called by the screenshot script right before the shot) puts the
  // player, rival, roadblock and heli back exactly where the scene was designed,
  // however far the car rolled while the page was warming up.
  window.__restage = () => stageShot(name, G);
}
