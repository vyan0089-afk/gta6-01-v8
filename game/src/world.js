// Builds Pulau Arunika in 3D: ground, sand and ocean, the road grid, windowed
// buildings kept clear of the roads, palms, lamps, parked cars, beach umbrellas,
// the wooden pier and the lighthouse. Also the low-poly car and helicopter meshes.
import { CFG } from './config.js';
import { createRandom, pick, range } from './random.js';

const THREE = window.THREE;

function windowTexture(rand, base) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 128, 256);
  const rows = 6 + Math.floor(rand() * 4), cols = 4;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const lit = rand() < 0.35;
      g.fillStyle = lit ? '#ffe9a3' : '#2c3e50';
      g.fillRect(10 + col * 30, 12 + r * (220 / rows), 18, 14);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function makeCarMesh(color, opts = {}) {
  const car = new THREE.Group();
  const paint = new THREE.MeshLambertMaterial({ color });
  const dark = new THREE.MeshLambertMaterial({ color: 0x14181d });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.4), paint);
  body.position.y = 0.55; car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.2), opts.glass ?? new THREE.MeshLambertMaterial({ color: 0x1c2b3a }));
  cabin.position.set(0, 1.05, -0.2); car.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.36, wz); car.add(w);
  }
  // headlights (front = +z) and taillights
  const hl = new THREE.MeshLambertMaterial({ color: 0xffe27a, emissive: 0xaa8822 });
  const tl = new THREE.MeshLambertMaterial({ color: 0xff2222, emissive: 0x880000 });
  for (const sx of [-0.65, 0.65]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.08), hl);
    h.position.set(sx, 0.62, 2.22); car.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.08), tl);
    t.position.set(sx, 0.62, -2.22); car.add(t);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.3), new THREE.MeshLambertMaterial({ color: 0x2244ff, emissive: 0x1122aa }));
    bar.position.set(0, 1.38, -0.2); car.add(bar);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.2, 4.42), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    stripe.position.y = 0.62; car.add(stripe);
  }
  car.userData.paint = paint;
  return car;
}

export function makeHeliMesh() {
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2244aa });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 3.4), bodyMat);
  body.position.y = 0; heli.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x9fd8ef }));
  glass.position.set(0, 0.25, 1.4); heli.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.6), bodyMat);
  tail.position.set(0, 0.3, -3.2); heli.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.8), bodyMat);
  fin.position.set(0, 0.8, -4.8); heli.add(fin);
  const rotor = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.08, 0.4), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  rotor.add(blade);
  const blade2 = blade.clone(); blade2.rotation.y = Math.PI / 2; rotor.add(blade2);
  rotor.position.y = 1.0; heli.add(rotor);
  heli.userData.rotor = rotor;
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 18, 16, 1, true), coneMat);
  cone.position.set(0, -9.5, 2); cone.rotation.x = 0.12; heli.add(cone);
  heli.userData.cone = cone;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
  lamp.position.set(0, -0.6, 1.6); heli.add(lamp);
  return heli;
}

function makePalm(rand) {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 4.6, 7), new THREE.MeshLambertMaterial({ color: 0x8a6b46 }));
  trunk.position.y = 2.3; trunk.rotation.z = range(rand, -0.08, 0.08); palm.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.6, 7), new THREE.MeshLambertMaterial({ color: 0x2f9e4f }));
  crown.position.y = 5.0; crown.scale.y = 0.55; palm.add(crown);
  const crown2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 7), new THREE.MeshLambertMaterial({ color: 0x3fb85f }));
  crown2.position.y = 5.5; crown2.scale.y = 0.5; palm.add(crown2);
  return palm;
}

export function createWorld(G) {
  const rand = createRandom(CFG.game.seed);
  const W = CFG.world;
  const scene = G.scene;
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];

  // Ground, sand, ocean
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W.half * 2, W.half * 2), new THREE.MeshLambertMaterial({ color: CFG.palette.grass }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0; group.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(50, W.half * 2), new THREE.MeshLambertMaterial({ color: CFG.palette.sand }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(275, 0.03, 0); group.add(sand);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(420, W.half * 2 + 80), new THREE.MeshLambertMaterial({ color: CFG.palette.ocean }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(510, 0.02, 0); group.add(ocean);
  const oceanFar = new THREE.Mesh(new THREE.PlaneGeometry(420, 2000), new THREE.MeshLambertMaterial({ color: CFG.palette.oceanDeep }));
  oceanFar.rotation.x = -Math.PI / 2; oceanFar.position.set(510, 0.01, 0); group.add(oceanFar);

  // Road grid
  const roads = [];
  for (let i = -5; i <= 5; i++) roads.push(i * W.roadSpacing);
  const roadMat = new THREE.MeshLambertMaterial({ color: CFG.palette.road });
  const lineMat = new THREE.MeshBasicMaterial({ color: CFG.palette.roadLine });
  for (const x of roads) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(W.roadWidth, 0.1, W.half * 2), roadMat);
    r.position.set(x, 0.05, 0); group.add(r);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, W.half * 2), lineMat);
    line.position.set(x, 0.06, 0); group.add(line);
  }
  for (const z of roads) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(W.half * 2, 0.1, W.roadWidth), roadMat);
    r.position.set(0, 0.05, z); group.add(r);
    const line = new THREE.Mesh(new THREE.BoxGeometry(W.half * 2, 0.12, 0.35), lineMat);
    line.position.set(0, 0.06, z); group.add(line);
  }

  // Buildings, kept at least 14 m from any road centreline.
  const texMats = CFG.palette.building.map((c) => {
    const hex = '#' + c.toString(16).padStart(6, '0');
    return new THREE.MeshLambertMaterial({ map: windowTexture(rand, hex) });
  });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4f55 });
  const garageBlock = { x0: -68, x1: 0, z0: 0, z1: 68 };
  const safeBlock = { x0: -204, x1: -136, z0: 272, z1: 340 };
  for (let ix = 0; ix < roads.length - 1; ix++) {
    for (let iz = 0; iz < roads.length - 1; iz++) {
      const x0 = roads[ix] + 14, x1 = roads[ix + 1] - 14;
      const z0 = roads[iz] + 14, z1 = roads[iz + 1] - 14;
      if (x0 >= 250) continue; // beach: no buildings on the sand
      if (x0 >= garageBlock.x0 && x1 <= garageBlock.x1 + 14 && z0 >= garageBlock.z0 && z1 <= garageBlock.z1 + 14) continue;
      if (x0 >= safeBlock.x0 && x1 <= safeBlock.x1 + 14 && z0 >= safeBlock.z0 && z1 <= safeBlock.z1 + 14) continue;
      if (rand() < 0.25) continue;
      const n = 1 + Math.floor(rand() * 2);
      for (let b = 0; b < n; b++) {
        const w = range(rand, 12, 20), d = range(rand, 12, 20);
        const cx = range(rand, x0 + w / 2, x1 - w / 2);
        const cz = range(rand, z0 + d / 2, z1 - d / 2);
        const h = range(rand, 8, 42);
        const mat = pick(rand, texMats);
        const bld = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        bld.position.set(cx, h / 2, cz); group.add(bld);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), roofMat);
        roof.position.set(cx, h + 0.25, cz); group.add(roof);
        colliders.push({ x: cx, z: cz, hw: w / 2, hd: d / 2 });
      }
    }
  }

  // Garage (player's base) at (-34, 34)
  const garage = new THREE.Group();
  const gBody = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 18), new THREE.MeshLambertMaterial({ color: 0x3a6ea5 }));
  gBody.position.y = 4.5; garage.add(gBody);
  const gDoor = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, 0.4), new THREE.MeshLambertMaterial({ color: 0x222831 }));
  gDoor.position.set(0, 3.25, -9.1); garage.add(gDoor);
  const gSign = new THREE.Mesh(new THREE.BoxGeometry(20, 1.6, 0.4), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  gSign.position.set(0, 8.2, -9.2); garage.add(gSign);
  garage.position.set(W.garage.x, 0, W.garage.z);
  group.add(garage);
  colliders.push({ x: W.garage.x - 8, z: W.garage.z, hw: 5, hd: 9 });
  colliders.push({ x: W.garage.x + 8, z: W.garage.z, hw: 5, hd: 9 });
  colliders.push({ x: W.garage.x, z: W.garage.z + 9, hw: 13, hd: 1 }); // back wall

  // Safehouse at (-170, 300)
  const safe = new THREE.Group();
  const sBody = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 10), new THREE.MeshLambertMaterial({ color: 0xe8dcc0 }));
  sBody.position.y = 3; safe.add(sBody);
  const sRoof = new THREE.Mesh(new THREE.ConeGeometry(9, 4, 4), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
  sRoof.position.y = 8; sRoof.rotation.y = Math.PI / 4; safe.add(sRoof);
  safe.position.set(W.safehouse.x, 0, W.safehouse.z);
  group.add(safe);
  colliders.push({ x: W.safehouse.x, z: W.safehouse.z, hw: 6, hd: 5 });

  // Bank Arunika at (68, 0) — job 7 target
  const bank = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 18), new THREE.MeshLambertMaterial({ color: 0xd9c9a8 }));
  bank.position.set(68, 8, 0); group.add(bank);
  const bankRoof = new THREE.Mesh(new THREE.BoxGeometry(25, 1, 19), roofMat);
  bankRoof.position.set(68, 16.5, 0); group.add(bankRoof);
  colliders.push({ x: 68, z: 0, hw: 12, hd: 9 });

  // Palms: beach row + along roads
  const palms = [];
  for (let z = -320; z <= 320; z += 22) {
    const p = makePalm(rand); p.position.set(258 + range(rand, -3, 4), 0, z + range(rand, -4, 4)); group.add(p); palms.push(p);
  }
  for (let i = 0; i < 40; i++) {
    const x = pick(rand, roads.slice(1, -1)) + pick(rand, [-9, 9]);
    const z = range(rand, -320, 320);
    if (x > 240) continue;
    const p = makePalm(rand); p.position.set(x, 0, z); group.add(p); palms.push(p);
  }

  // Street lamps along the avenues
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x30343a });
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  const lamps = [];
  for (const x of roads) {
    if (x > 250) continue;
    for (let z = -306; z <= 306; z += 68) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6), lampMat);
      pole.position.set(x + 7, 3, z); group.add(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), lampHeadMat);
      head.position.set(x + 7, 6.1, z); group.add(head);
      lamps.push(head);
    }
  }

  // Parked cars along roads
  const parkedColors = [0xc0392b, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x27ae60, 0x8e44ad, 0xecf0f1];
  const parked = [];
  for (let i = 0; i < 24; i++) {
    const x = pick(rand, roads.slice(1, -1)) + pick(rand, [-8.5, 8.5]);
    const z = range(rand, -320, 320);
    if (x > 240) continue;
    const car = makeCarMesh(pick(rand, parkedColors));
    car.position.set(x, 0, z);
    car.rotation.y = (Math.abs(x) % 2 < 1 ? 0 : Math.PI) + (Math.random() < 0.5 ? 0 : 0);
    car.rotation.y = pick(rand, [0, Math.PI / 2, Math.PI, -Math.PI / 2]);
    group.add(car); parked.push(car);
    colliders.push({ x, z, hw: 1.4, hd: 2.4 });
  }

  // Beach umbrellas on the sand, east of the beach boulevard (x=272 is the road).
  for (let i = 0; i < 10; i++) {
    const z = -300 + i * 62 + range(rand, -8, 8);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), lampMat);
    pole.position.set(286, 1.3, z); group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.0, 8), new THREE.MeshLambertMaterial({ color: pick(rand, [0xff5a5a, 0xffd23f, 0x3fa7ff, 0xff7a1a]) }));
    top.position.set(286, 2.9, z); group.add(top);
  }

  // Wooden pier at z=-250, from the beach out into the ocean
  const pierMat = new THREE.MeshLambertMaterial({ color: 0x8a6b46 });
  for (let x = 256; x <= 334; x += 6) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 8), pierMat);
    plank.position.set(x, 0.6, -250); group.add(plank);
  }
  for (let x = 258; x <= 332; x += 12) {
    for (const dz of [-3.6, 3.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 6), pierMat);
      post.position.set(x, 0, -250 + dz); group.add(post);
    }
  }

  // Lighthouse at the end of the pier
  const lh = new THREE.Group();
  const lhBody = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 22, 12), new THREE.MeshLambertMaterial({ color: 0xf5f0e6 }));
  lhBody.position.y = 11; lh.add(lhBody);
  const lhBand = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 3, 12), new THREE.MeshLambertMaterial({ color: 0xd63031 }));
  lhBand.position.y = 15; lh.add(lhBand);
  const lhTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.4, 12), new THREE.MeshLambertMaterial({ color: 0x222831 }));
  lhTop.position.y = 23; lh.add(lhTop);
  const lhLight = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff6c0 }));
  lhLight.position.y = 23; lh.add(lhLight);
  lh.position.set(336, 0, -250);
  group.add(lh);

  return { group, roads, colliders, palms, lamps, garage, safe, bank, lighthouse: lh };
}
