// Reza on foot and behind the wheel of the ARUNIKA GT. Arcade physics: the car
// accelerates, brakes, reverses and drifts with a handbrake; the car mesh is
// ALWAYS in the scene and rendered, whether Reza is driving it or standing next
// to it.
import { CFG } from './config.js';
import { makeCarMesh } from './world.js';

const THREE = window.THREE;

function makePedMesh() {
  const g = new THREE.Group();
  const shirt = new THREE.MeshLambertMaterial({ color: 0xff7a1a });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), shirt);
  body.position.y = 1.15; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), new THREE.MeshLambertMaterial({ color: 0xd9a066 }));
  head.position.y = 1.85; g.add(head);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  for (const sx of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.7, 0.3), legMat);
    leg.position.set(sx, 0.35, 0); g.add(leg);
  }
  for (const sx of [-0.45, 0.45]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.24), shirt);
    arm.position.set(sx, 1.15, 0); g.add(arm);
  }
  return g;
}

function collideCircle(G, x, z, r) {
  // World bounds and the ocean (the pier is the only way out to sea).
  const half = CFG.world.half - 2;
  x = Math.max(-half, Math.min(half, x));
  z = Math.max(-half, Math.min(half, z));
  const onPier = Math.abs(z - CFG.world.pierZ) < 6 && x > 250;
  if (x > 298 && !onPier) x = 298;
  // Building AABBs: push the circle out.
  for (const c of G.world.colliders) {
    const dx = x - Math.max(c.x - c.hw, Math.min(x, c.x + c.hw));
    const dz = z - Math.max(c.z - c.hd, Math.min(z, c.z + c.hd));
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        x += (dx / d) * (r - d);
        z += (dz / d) * (r - d);
      } else {
        x += r;
      }
    }
  }
  return { x, z };
}

export function createPlayer(G) {
  const carMesh = makeCarMesh(CFG.palette.playerCar);
  carMesh.position.set(0, 0, 40);
  G.scene.add(carMesh);
  const pedMesh = makePedMesh();
  pedMesh.position.set(0, 0, 44);
  G.scene.add(pedMesh);

  const p = {
    x: 0, z: 44, heading: 0, inCar: false,
    speed: 0, carSpeed: 0, carHeading: 0, carX: 0, carZ: 40,
    health: 100, armour: 50, money: 250, wanted: 0, rp: 0,
    weaponIdx: 0, ammo: [Infinity, 60, 120, 90],
    carHealth: 100, carColor: CFG.palette.playerCar, carColorName: 'ORANYE',
    moving: false, wrecked: false,
  };

  function syncMeshes() {
    carMesh.position.set(p.carX, 0, p.carZ);
    carMesh.rotation.y = p.carHeading;
    pedMesh.position.set(p.x, 0, p.z);
    pedMesh.rotation.y = p.heading;
    pedMesh.visible = !p.inCar;
    carMesh.visible = true; // the car is always rendered, driven or parked
  }

  function teleport(x, z, heading, inCar) {
    p.x = x; p.z = z; p.heading = heading;
    p.carX = x; p.carZ = z; p.carHeading = heading;
    p.carSpeed = 0; p.speed = 0;
    p.inCar = !!inCar;
    if (!inCar) { p.x = x + 3; p.z = z + 3; }
    syncMeshes();
  }

  function enterCar() {
    const dx = p.x - p.carX, dz = p.z - p.carZ;
    if (Math.hypot(dx, dz) < 5 && !p.wrecked) {
      p.inCar = true; p.heading = p.carHeading;
      G.audio?.blip(660, 0.08);
      G.hud?.say('SARI', 'Gas, Reza. Mobil sudah siap.');
      syncMeshes();
      return true;
    }
    return false;
  }

  function exitCar() {
    p.inCar = false;
    p.x = p.carX + Math.sin(p.carHeading + Math.PI / 2) * 2.5;
    p.z = p.carZ + Math.cos(p.carHeading + Math.PI / 2) * 2.5;
    p.heading = p.carHeading;
    syncMeshes();
  }

  function damageCar(amount) {
    if (p.wrecked) return;
    p.carHealth = Math.max(0, p.carHealth - amount);
    if (p.carHealth <= 0) {
      p.wrecked = true;
      p.carSpeed = 0;
      G.hud?.say('BAYU', 'Mobil hancur, Reza! Bawa ke garasi atau panggil aku.');
      if (p.inCar) exitCar();
    }
  }

  function repaint(color, name) {
    p.carColor = color; p.carColorName = name;
    carMesh.userData.paint.color.setHex(color);
    p.carHealth = 100; p.wrecked = false;
  }

  function update(dt, input) {
    const T = CFG.tuning;
    p.moving = false;
    if (p.inCar) {
      const fwd = input.forward ? 1 : 0, back = input.back ? 1 : 0;
      const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      if (fwd) p.carSpeed += T.carAccel * dt;
      if (back) {
        if (p.carSpeed > 0.5) p.carSpeed -= T.carBrake * dt;
        else p.carSpeed -= T.carAccel * 0.5 * dt;
      }
      if (!fwd && !back) p.carSpeed -= Math.sign(p.carSpeed) * Math.min(Math.abs(p.carSpeed), 12 * dt);
      const grip = input.handbrake ? T.handbrakeGrip : T.carGrip;
      p.carSpeed = Math.max(-T.carReverse, Math.min(T.carMax, p.carSpeed));
      const dir = p.carSpeed >= 0 ? 1 : -1;
      p.carHeading += steer * T.carTurn * dt * Math.min(1, Math.abs(p.carSpeed) / 12) * grip * dir;
      const nx = p.carX + Math.sin(p.carHeading) * p.carSpeed * dt;
      const nz = p.carZ + Math.cos(p.carHeading) * p.carSpeed * dt;
      const hit = collideCircle(G, nx, nz, 2.2);
      if (Math.abs(hit.x - nx) > 0.01 || Math.abs(hit.z - nz) > 0.01) {
        if (Math.abs(p.carSpeed) > 8) { damageCar(Math.abs(p.carSpeed) * 0.4); G.audio?.thud(); }
        p.carSpeed *= 0.4;
      }
      p.carX = hit.x; p.carZ = hit.z;
      p.x = p.carX; p.z = p.carZ; p.heading = p.carHeading;
      p.speed = Math.abs(p.carSpeed);
      p.moving = Math.abs(p.carSpeed) > 0.5;
    } else {
      const run = input.run;
      const spd = run ? T.runSpeed : T.walkSpeed;
      const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      p.heading += steer * 2.4 * dt;
      let mx = 0, mz = 0;
      if (input.forward) { mx = Math.sin(p.heading); mz = Math.cos(p.heading); }
      if (input.back) { mx = -Math.sin(p.heading); mz = -Math.cos(p.heading); }
      if (mx || mz) {
        p.moving = true;
        const hit = collideCircle(G, p.x + mx * spd * dt, p.z + mz * spd * dt, 0.9);
        p.x = hit.x; p.z = hit.z;
      }
      p.speed = (mx || mz) ? spd : 0;
    }
    syncMeshes();
  }

  syncMeshes();
  return { state: p, carMesh, pedMesh, update, teleport, enterCar, exitCar, damageCar, repaint };
}
