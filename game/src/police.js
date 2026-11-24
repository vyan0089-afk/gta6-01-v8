// APD — Arunika Police Department. Chase units spawn IN FRONT of the player, in
// the direction of travel, so they are visible in the camera; they ram the
// player's car. At wanted 3+ a roadblock parks across the road ahead and
// RAJAWALI-1 orbits overhead with its searchlight.
import { CFG, wantedFor } from './config.js';
import { makeCarMesh, makeHeliMesh } from './world.js';

const THREE = window.THREE;

export function createPolice(G) {
  const T = CFG.tuning;
  const units = [];
  for (let i = 0; i < 6; i++) {
    const mesh = makeCarMesh(CFG.palette.policeCar, { police: true });
    mesh.visible = false;
    G.scene.add(mesh);
    units.push({ mesh, active: false, x: 0, z: 0, heading: 0, speed: 0, cooldown: 0 });
  }
  const roadblock = [];
  for (let i = 0; i < 3; i++) {
    const mesh = makeCarMesh(CFG.palette.policeCar, { police: true });
    mesh.visible = false;
    G.scene.add(mesh);
    roadblock.push({ mesh, active: false, x: 0, z: 0, heading: 0, knocked: 0 });
  }
  let roadblockPlaced = false;
  const heliMesh = makeHeliMesh();
  heliMesh.scale.setScalar(T.heliScale);
  heliMesh.visible = false;
  G.scene.add(heliMesh);
  let heliAngle = Math.PI;
  let heliActive = false;
  let decayTimer = 0;

  function setHeliAngle(a) { heliAngle = a; }

  function spawnAhead(unit, dist) {
    const p = G.player.state;
    const hx = Math.sin(p.heading), hz = Math.cos(p.heading);
    const side = (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 10);
    const px = -hz * side, pz = hx * side;
    unit.x = p.x + hx * dist + px;
    unit.z = p.z + hz * dist + pz;
    unit.heading = p.heading + (Math.random() - 0.5) * 0.6;
    unit.speed = 10;
    unit.active = true;
    unit.mesh.visible = true;
  }

  function placeRoadblock() {
    const p = G.player.state;
    const hx = Math.sin(p.heading), hz = Math.cos(p.heading);
    const bx = p.x + hx * 55, bz = p.z + hz * 55;
    const perp = Math.atan2(hx, hz) + Math.PI / 2;
    roadblock.forEach((rb, i) => {
      const off = (i - 1) * 4.5;
      rb.x = bx + Math.sin(perp) * off;
      rb.z = bz + Math.cos(perp) * off;
      rb.heading = perp;
      rb.active = true; rb.knocked = 0;
      rb.mesh.visible = true;
      rb.mesh.position.set(rb.x, 0, rb.z);
      rb.mesh.rotation.y = rb.heading;
    });
    roadblockPlaced = true;
    G.hud?.dispatch('APD DISPATCH', 'Roadblock di depan! Semua unit siaga.');
  }

  function update(dt) {
    const p = G.player.state;
    const w = wantedFor(p.wanted);
    const px = p.x, pz = p.z;

    // Chase units: keep `w.chase` active, spawn ahead of the player.
    let active = 0;
    for (const u of units) if (u.active) active += 1;
    for (const u of units) {
      if (!u.active && active < w.chase) {
        spawnAhead(u, 55 + Math.random() * 25);
        active += 1;
        G.hud?.dispatch('APD DISPATCH', 'Unit APD mendekat — Reza terlihat di ' + (G.hud?.districtName() ?? 'Kota Arunika') + '.');
      }
    }
    for (const u of units) {
      if (!u.active) continue;
      const dx = px - u.x, dz = pz - u.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 200 || p.wanted === 0) { u.active = false; u.mesh.visible = false; continue; }
      const wantHeading = Math.atan2(dx, dz);
      let dh = wantHeading - u.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      u.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
      u.speed = Math.min(T.policeMax, u.speed + T.policeAccel * dt);
      u.x += Math.sin(u.heading) * u.speed * dt;
      u.z += Math.cos(u.heading) * u.speed * dt;
      u.mesh.position.set(u.x, 0, u.z);
      u.mesh.rotation.y = u.heading;
      // Ram: contact damages the player's car and slows both.
      if (dist < 3.6 && u.cooldown <= 0) {
        u.cooldown = 1.2;
        u.speed *= 0.35;
        if (p.inCar) {
          G.player.damageCar(9);
          p.carSpeed *= 0.55;
        } else {
          p.health = Math.max(0, p.health - 8);
          if (p.health <= 0) G.gameOver?.();
        }
        G.audio?.thud();
        G.hud?.flash('TABRAKAN! APD menabrakmu.');
      }
      if (u.cooldown > 0) u.cooldown -= dt;
    }

    // Roadblock at wanted 3+.
    if (w.roadblock && !roadblockPlaced) placeRoadblock();
    if (!w.roadblock && roadblockPlaced) {
      for (const rb of roadblock) { rb.active = false; rb.mesh.visible = false; }
      roadblockPlaced = false;
    }
    // If the player smashed through every roadblock car, a fresh one parks ahead.
    if (roadblockPlaced && roadblock.every((rb) => !rb.active)) roadblockPlaced = false;
    if (roadblockPlaced) {
      for (const rb of roadblock) {
        if (!rb.active) continue;
        const d = Math.hypot(px - rb.x, pz - rb.z);
        if (d > 130) { placeRoadblock(); break; }
        if (rb.knocked > 0) {
          rb.knocked -= dt;
          rb.mesh.position.x += Math.sin(rb.heading + Math.PI / 2) * 6 * dt;
          rb.mesh.position.z += Math.cos(rb.heading + Math.PI / 2) * 6 * dt;
          rb.mesh.rotation.y += 3 * dt;
          if (rb.knocked <= 0) { rb.active = false; rb.mesh.visible = false; }
          continue;
        }
        if (d < 3.4 && Math.abs(p.carSpeed) > 6) {
          rb.knocked = 1.6;
          G.player.damageCar(12);
          p.carSpeed *= 0.6;
          G.audio?.thud();
          G.hud?.flash('ROADBLOCK DITEROBOS!');
          G.missions?.onRoadblockSmashed?.();
        }
      }
    }

    // Helicopter at wanted 3+.
    heliActive = w.heli;
    heliMesh.visible = heliActive;
    if (heliActive) {
      heliAngle += T.heliOrbit * dt;
      // Same sin/cos convention as player heading: angle PI = straight ahead
      // of a player facing PI, so the heli starts in front of the camera.
      const hx = px + Math.sin(heliAngle) * T.heliDist;
      const hz = pz + Math.cos(heliAngle) * T.heliDist;
      heliMesh.position.set(hx, T.heliHeight, hz);
      heliMesh.userData.rotor.rotation.y += 14 * dt;
      // Face the player and aim the cone down at them.
      heliMesh.lookAt(px, 0, pz);
      heliMesh.userData.cone.lookAt(px, 0, pz);
    }

    // Wanted decays slowly when no unit is close.
    if (p.wanted > 0) {
      let near = false;
      for (const u of units) if (u.active && Math.hypot(px - u.x, pz - u.z) < 40) near = true;
      if (!near && !heliActive) {
        decayTimer += dt;
        if (decayTimer > 25) { p.wanted -= 1; decayTimer = 0; G.hud?.say('SARI', 'Mereka kehilangan jejakmu. Wanted turun.'); }
      } else decayTimer = 0;
    }
  }

  function clearAll() {
    for (const u of units) { u.active = false; u.mesh.visible = false; }
    for (const rb of roadblock) { rb.active = false; rb.mesh.visible = false; }
    roadblockPlaced = false;
    heliMesh.visible = false; heliActive = false;
  }

  return { units, roadblock, heliMesh, update, setHeliAngle, clearAll, get heliActive() { return heliActive; } };
}
