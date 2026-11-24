// ARUNIKA — open-world crime on a fictional tropical island.
// Every name, number and colour the game uses lives here.
export const CFG = {
  game: { title: 'ARUNIKA', subtitle: 'Pulau Arunika — Kota Arunika', seed: 20261124 },

  world: {
    half: 340, beachX: 250, oceanX: 300, pierZ: -250,
    roadSpacing: 68, roadWidth: 12,
    garage: { x: -34, z: 34, radius: 10 },
    safehouse: { x: -170, z: 300 },
    pier: { x: 300, z: -250 },
  },

  districts: [
    { name: 'Pantai Arunika', x0: 250, x1: 340, z0: -340, z1: 340, standing: 42 },
    { name: 'Kota Lama', x0: -204, x1: -68, z0: 68, z1: 340, standing: 58 },
    { name: 'Pelabuhan', x0: -68, x1: 68, z0: -340, z1: -204, standing: 35 },
    { name: 'Bukit Senja', x0: -340, x1: -204, z0: -340, z1: -68, standing: 48 },
    { name: 'Pusat Kota', x0: -204, x1: 204, z0: -68, z1: 68, standing: 48 },
  ],

  wanted: [
    { stars: 0, chase: 0, roadblock: false, heli: false },
    { stars: 1, chase: 2, roadblock: false, heli: false },
    { stars: 2, chase: 3, roadblock: false, heli: false },
    { stars: 3, chase: 4, roadblock: true, heli: true },
    { stars: 4, chase: 5, roadblock: true, heli: true },
    { stars: 5, chase: 6, roadblock: true, heli: true },
  ],

  ranks: [
    { name: 'ROOKIE', rp: 0 },
    { name: 'STREET', rp: 400 },
    { name: 'DRIVER', rp: 1200 },
    { name: 'FIXER', rp: 2600 },
    { name: 'KING', rp: 5000 },
  ],

  crew: [
    { id: 'sari', name: 'SARI', role: 'Driver', ability: 'SWAP PLATES', key: 'Z', color: '#0ea5e9', desc: 'Turunkan 1 bintang wanted' },
    { id: 'bayu', name: 'BAYU', role: 'Mechanic', ability: 'QUICK FIX', key: 'X', color: '#f59e0b', desc: 'Perbaiki mobil 100%' },
    { id: 'lia', name: 'LIA', role: 'Lookout', ability: 'EYES OUT', key: 'C', color: '#a855f7', desc: 'Polisi terlihat di minimap 25 dtk' },
  ],
  crewCooldown: 30,
  liaDuration: 25,

  weapons: [
    { id: 'fists', name: 'FISTS', key: '1', ammo: Infinity },
    { id: '38', name: '.38', key: '2', ammo: 60 },
    { id: 'smg', name: 'SMG', key: '3', ammo: 120 },
    { id: 'ar9', name: 'AR-9', key: '4', ammo: 90 },
  ],

  jobs: [
    { id: 1, title: 'Sopir Baru', speaker: 'sari', reward: 400, rp: 350, type: 'reach', target: { x: -34, z: 34 }, brief: 'Drive to the garage and meet the crew.', detail: 'Garasi di Pusat Kota. Temui Sari, Bayu dan Lia di sana.' },
    { id: 2, title: 'Kurir Pantai', speaker: 'sari', reward: 650, rp: 500, type: 'timed', target: { x: 300, z: -250 }, time: 75, brief: 'Deliver the package to Kumala Pier before the clock runs out.', detail: 'Paket harus sampai di Dermaga Kumala sebelum waktu habis.' },
    { id: 3, title: 'Kejar-Kejaran', speaker: 'sari', reward: 900, rp: 650, type: 'ram', target: { x: 272, z: -90 }, brief: 'Wreck the rival Regent before it reaches the pier.', detail: 'Tabrak Regent merah itu sampai hancur sebelum dia sampai dermaga.' },
    { id: 4, title: 'Jalan Tikus', speaker: 'sari', reward: 750, rp: 550, type: 'escape', target: { x: -170, z: 300 }, brief: 'Lose the APD tail through the old town.', detail: 'Hilang dari kejaran APD lewat gang-gang Kota Lama.' },
    { id: 5, title: 'Blokir Jalan', speaker: 'sari', reward: 1100, rp: 800, type: 'ram', target: { x: 0, z: 0 }, brief: 'Smash through the APD roadblock on Surya Boulevard.', detail: 'Terobos roadblock APD di Surya Boulevard.' },
    { id: 6, title: 'Rajawali-1', speaker: 'sari', reward: 1300, rp: 950, type: 'escape', target: { x: -170, z: 300 }, brief: 'Break the spotlight: lose the air unit and reach the safehouse.', detail: 'Lepas dari sorotan Rajawali-1, lalu sembunyi di safehouse.' },
    { id: 7, title: 'Bank Arunika', speaker: 'bayu', reward: 2500, rp: 1400, type: 'reach', target: { x: 68, z: 0 }, brief: 'Hit the bank, then vanish to the safehouse.', detail: 'Renggut Bank Arunika, lalu menghilang ke safehouse.' },
    { id: 8, title: 'Balap Jalanan', speaker: 'sari', reward: 1800, rp: 1200, type: 'race', target: { x: 272, z: 60 }, laps: 3, brief: 'Win the street race: three laps around Pantai Arunika.', detail: 'Tiga putaran mengelilingi Pantai Arunika. Menang atau pulang.' },
    { id: 9, title: 'Pengejaran Terakhir', speaker: 'sari', reward: 2200, rp: 1600, type: 'escape', target: { x: 300, z: -250 }, brief: 'Outrun a 5-star pursuit to the pier.', detail: 'Kejaran 5 bintang. Satu-satunya jalan keluar: Dermaga Kumala.' },
    { id: 10, title: 'Raja Arunika', speaker: 'lia', reward: 3000, rp: 2000, type: 'race', target: { x: 272, z: 60 }, laps: 3, brief: 'Take the crown: the final race for the island.', detail: 'Balapan terakhir memperebutkan mahkota Pulau Arunika.' },
  ],

  tuning: {
    walkSpeed: 5, runSpeed: 9,
    carAccel: 26, carBrake: 42, carMax: 46, carReverse: 14,
    carTurn: 2.1, carGrip: 0.92, handbrakeGrip: 0.55,
    policeAccel: 22, policeMax: 44,
    heliHeight: 20, heliSpeed: 26, heliDist: 55, heliOrbit: 0.15, heliScale: 1.6,
  },

  palette: {
    playerCar: 0xff7a1a, policeCar: 0x1e3a8a, policeLight: 0x3b82f6,
    road: 0x2b2f36, roadLine: 0xf5d90a, sidewalk: 0x8a8f96,
    grass: 0x3f8f4f, sand: 0xe8d29a, ocean: 0x1e7fa8, oceanDeep: 0x0f5e86,
    skyDay: 0x87ceeb, skyDusk: 0xff9a5c, skyNight: 0x1b2a4a,
    sun: 0xfff2c0, building: [0xd8c9a3, 0xc9b18c, 0xb7a6d6, 0x9fb8c8, 0xe0a899, 0xcfd8dc],
  },

  radio: [
    { id: 'surya', name: 'SURYA 101.5 FM', genre: 'Island Pop', bpm: 112, root: 220 },
    { id: 'ombo', name: 'OMBO 98.4 FM', genre: 'Sunset Synth', bpm: 96, root: 174.61 },
    { id: 'talk', name: 'ARUNIKA TALK 88.1', genre: 'Talk & News', bpm: 0, root: 0 },
  ],

  police: { name: 'ARUNIKA PD', short: 'APD', heliCallsign: 'RAJAWALI-1' },
  player: { name: 'REZA', carName: 'ARUNIKA GT' },
  saveKey: 'arunika.save.v1',
};

export function rankFor(rp) {
  let rank = CFG.ranks[0];
  for (const r of CFG.ranks) if (rp >= r.rp) rank = r;
  return rank;
}
export function districtAt(x, z) {
  for (const d of CFG.districts) if (x >= d.x0 && x <= d.x1 && z >= d.z0 && z <= d.z1) return d;
  // Between districts: name the nearest one rather than open sea.
  let best = CFG.districts[0], bestD = Infinity;
  for (const d of CFG.districts) {
    const cx = (d.x0 + d.x1) / 2, cz = (d.z0 + d.z1) / 2;
    const dd = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best;
}
export function wantedFor(stars) { return CFG.wanted[Math.max(0, Math.min(5, stars))]; }
