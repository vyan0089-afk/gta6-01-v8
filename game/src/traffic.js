// Traffic: 26 cars cruising the road grid and 34 pedestrians on the sidewalks.
// Cars follow one avenue or street and wrap around the island edge; pedestrians
// wander inside the blocks between roads.
import { CFG } from './config.js';
import { createRandom, pick, range } from './random.js';
import { makeCarMesh } from './world.js';

const THREE = window.THREE;

const CAR_COLORS = [0xc0392b, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x27ae60, 0x8e44ad, 0xecf0f1, 0xe67e22, 0x16a085, 0x2c3e50];
const PED_COLORS = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xfd79a8, 0xffffff, 0x636e72];

function makePedMesh(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.85, 0.35), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 1.1; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshLambertMaterial({ color: 0xd9a066 }));
  head.position.y = 1.78; g.add(head);
  for (const sx of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.65, 0.26), new THREE.MeshLambertMaterial({ color: 0x2c3e50 }));
    leg.position.set(sx, 0.32, 0); g.add(leg);
  }
  return g;
}

export function createTraffic(G) {
  const rand = createRandom(CFG.game.seed + 7);
  const roads = G.world.roads;
  const cars = [];
  for (let i = 0; i < 26; i++) {
    const along = rand() < 0.5; // avenue (moves in z) or street (moves in x)
    const road = pick(rand, roads.slice(1, -1));
    const lane = pick(rand, [-2.6, 2.6]);
    const dir = pick(rand, [-1, 1]);
    const mesh = makeCarMesh(pick(rand, CAR_COLORS));
    G.scene.add(mesh);
    const car = {
      mesh, along, road, lane, dir,
      speed: range(rand, 8, 16),
      x: along ? road + lane : range(rand, -320, 320),
      z: along ? range(rand, -320, 320) : road + lane,
      heading: along ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2),
    };
    mesh.position.set(car.x, 0, car.z);
    mesh.rotation.y = car.heading;
    cars.push(car);
  }

  const peds = [];
  for (let i = 0; i < 34; i++) {
    const mesh = makePedMesh(pick(rand, PED_COLORS));
    G.scene.add(mesh);
    const ped = {
      mesh,
      x: range(rand, -320, 240), z: range(rand, -320, 320),
      heading: rand() * Math.PI * 2,
      speed: range(rand, 1.2, 2.4),
      retarget: range(rand, 2, 8),
    };
    mesh.position.set(ped.x, 0, ped.z);
    peds.push(ped);
  }

  function update(dt) {
    for (const car of cars) {
      if (car.along) {
        car.z += car.dir * car.speed * dt;
        if (car.z > 335) car.z = -335;
        if (car.z < -335) car.z = 335;
      } else {
        car.x += car.dir * car.speed * dt;
        if (car.x > 240) car.x = -335;
        if (car.x < -335) car.x = 240;
      }
      car.mesh.position.set(car.x, 0, car.z);
    }
    for (const ped of peds) {
      ped.retarget -= dt;
      if (ped.retarget <= 0) {
        ped.heading = rand() * Math.PI * 2;
        ped.retarget = range(rand, 3, 9);
      }
      ped.x += Math.sin(ped.heading) * ped.speed * dt;
      ped.z += Math.cos(ped.heading) * ped.speed * dt;
      // Stay off the beach road and the ocean, inside the island.
      if (ped.x > 245) { ped.x = 245; ped.heading = Math.PI + rand(); }
      if (ped.x < -335) { ped.x = -335; ped.heading = rand(); }
      if (ped.z > 335) { ped.z = 335; ped.heading = Math.PI / 2 + rand(); }
      if (ped.z < -335) { ped.z = -335; ped.heading = -Math.PI / 2 + rand(); }
      ped.mesh.position.set(ped.x, 0, ped.z);
      ped.mesh.rotation.y = ped.heading;
    }
  }

  return { cars, peds, update };
}
