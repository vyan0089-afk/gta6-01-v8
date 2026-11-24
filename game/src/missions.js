// The 10 story jobs of ARUNIKA, each a small state machine: reach a place, beat a
// clock, wreck a rival, lose a tail, or win a race. Completing a job pays cash and
// RP; failing it lets Reza retry.
import { CFG } from './config.js';
import { makeCarMesh } from './world.js';

const RACE_LOOP = [
  { x: 272, z: -200 }, { x: 272, z: 200 }, { x: 204, z: 200 }, { x: 204, z: -200 },
];

export function createMissions(G) {
  const m = {
    index: 0, active: false, done: false, failed: false,
    timer: 0, lap: 1, checkpoint: 0, rivalHealth: 0, rival: null,
    message: '', objective: null, racePos: 1, rivalProgress: 0,
  };

  function speakerName(job) {
    const c = CFG.crew.find((x) => x.id === job.speaker);
    return c ? c.name : 'SARI';
  }

  function startJob(i) {
    const job = CFG.jobs[i];
    m.index = i; m.active = true; m.done = false; m.failed = false;
    m.timer = job.time ?? 0; m.lap = 1; m.checkpoint = 0; m.rivalProgress = 0; m.phase2 = false;
    m.objective = job.target;
    const p = G.player.state;
    // Job-specific wanted and setup.
    if (i === 3) p.wanted = 2; // Jalan Tikus: APD tail
    if (i === 5) p.wanted = 3; // Rajawali-1: air unit
    if (i === 8) p.wanted = 5; // Pengejaran Terakhir
    if (i === 1) p.wanted = Math.max(p.wanted, 1);
    if (i === 4) p.wanted = Math.max(p.wanted, 3); // Blokir Jalan
    if (i === 2 || i === 6) spawnRival(job);
    if (i === 7 || i === 9) spawnRacers();
    G.hud?.say(speakerName(job), `${job.title}: ${job.brief}`);
    G.hud?.setMission(job, m);
    m.message = '';
  }

  function spawnRival(job) {
    clearRival();
    const mesh = makeCarMesh(0xd63031);
    mesh.position.set(job.target.x, 0, job.target.z);
    G.scene.add(mesh);
    m.rival = { mesh, x: job.target.x, z: job.target.z, heading: Math.PI, speed: 12, health: 100 };
    m.rivalHealth = 100;
  }

  function spawnRacers() {
    clearRival();
    // Two rival racers that follow the loop; their progress sets Reza's position.
    // They line up beside Reza on the start line (same checkpoint), so the race
    // begins level — POS 1/3 — and is decided on the road.
    const p = G.player.state;
    const mk = (color, off) => {
      const mesh = makeCarMesh(color);
      mesh.position.set(p.x + off, 0, p.z);
      G.scene.add(mesh);
      return { mesh, x: p.x + off, z: p.z, heading: p.heading, speed: 13 + Math.abs(off) * 0.2, cp: 0, lap: 1 };
    };
    m.rival = { racers: [mk(0x27ae60, -5), mk(0x8e44ad, 5)] };
  }

  function clearRival() {
    if (!m.rival) return;
    if (m.rival.racers) for (const r of m.rival.racers) G.scene.remove(r.mesh);
    else G.scene.remove(m.rival.mesh);
    m.rival = null;
  }

  function complete() {
    const job = CFG.jobs[m.index];
    const p = G.player.state;
    p.money += job.reward;
    p.rp += job.rp;
    m.active = false; m.done = true;
    clearRival();
    G.audio?.fanfare();
    G.hud?.say(speakerName(job), `Job selesai! +$${job.reward.toLocaleString('en-US')} — ${job.title}.`);
    G.hud?.banner(`JOB SELESAI — ${job.title.toUpperCase()}`, `+$${job.reward.toLocaleString('en-US')}  •  +${job.rp} RP`);
    G.hud?.setMission(job, m);
    G.save?.autosave?.();
  }

  function fail(reason) {
    const job = CFG.jobs[m.index];
    m.active = false; m.failed = true;
    clearRival();
    G.audio?.fail();
    G.hud?.say(speakerName(job), `Gagal: ${reason} Tekan R untuk coba lagi.`);
    G.hud?.banner('JOB GAGAL', reason);
    G.hud?.setMission(job, m);
  }

  function retry() {
    if (!m.failed && !m.done) return;
    startJob(m.index);
  }

  function nextJob() {
    if (m.index < CFG.jobs.length - 1) startJob(m.index + 1);
    else G.hud?.banner('RAJA ARUNIKA', 'Semua job selesai. Pulau ini milikmu, Reza.');
  }

  function onRoadblockSmashed() {
    if (m.active && m.index === 4) complete();
  }

  function update(dt) {
    if (!m.active) return;
    const job = CFG.jobs[m.index];
    const p = G.player.state;
    const px = p.x, pz = p.z;

    if (job.type === 'timed') {
      m.timer -= dt;
      if (m.timer <= 0) { fail('Waktu habis di Dermaga Kumala.'); return; }
    }

    if (job.type === 'reach' || job.type === 'timed' || job.type === 'escape') {
      // Job 7 has two legs: the bank, then the safehouse.
      const t = (job.id === 7 && m.phase2) ? CFG.world.safehouse : job.target;
      const d = Math.hypot(px - t.x, pz - t.z);
      m.objective = t;
      if (d < 9) {
        if (job.type === 'escape' && m.index !== 8) {
          // Must be clear of the tail first.
          let near = false;
          for (const u of G.police.units) if (u.active && Math.hypot(px - u.x, pz - u.z) < 30) near = true;
          if (near) { m.message = 'APD masih di ekormu — hilang dulu!'; return; }
        }
        if (job.id === 7 && !m.phase2) {
          m.phase2 = true;
          m.objective = CFG.world.safehouse;
          m.message = 'Bank dirampok! Sekarang menghilang ke safehouse.';
          G.hud?.say('BAYU', 'Duitnya di tangan. Menghilang ke safehouse, cepat!');
          return;
        }
        complete(); return;
      }
    }

    if (job.type === 'ram' && m.index === 2 && m.rival) {
      // Rival Regent drives toward the pier; ram it to wreck it.
      const r = m.rival;
      const tx = CFG.world.pier.x, tz = CFG.world.pier.z;
      const want = Math.atan2(tx - r.x, tz - r.z);
      let dh = want - r.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      r.heading += Math.max(-1.4 * dt, Math.min(1.4 * dt, dh));
      r.x += Math.sin(r.heading) * r.speed * dt;
      r.z += Math.cos(r.heading) * r.speed * dt;
      r.mesh.position.set(r.x, 0, r.z);
      r.mesh.rotation.y = r.heading;
      m.objective = { x: r.x, z: r.z };
      const d = Math.hypot(px - r.x, pz - r.z);
      if (d < 3.8 && Math.abs(p.carSpeed) > 6 && p.inCar) {
        r.health -= Math.abs(p.carSpeed) * 1.6;
        m.rivalHealth = Math.max(0, r.health);
        p.carSpeed *= 0.6;
        G.audio?.thud();
        G.hud?.flash(`REGENT ${Math.round(m.rivalHealth)}%`);
        if (r.health <= 0) { complete(); return; }
      }
      if (Math.hypot(r.x - tx, r.z - tz) < 12) { fail('Regent itu sampai di dermaga duluan.'); return; }
    }

    if (job.type === 'race') {
      const cp = RACE_LOOP[m.checkpoint];
      m.objective = cp;
      const d = Math.hypot(px - cp.x, pz - cp.z);
      if (d < 12) {
        m.checkpoint += 1;
        G.audio?.blip(880, 0.12);
        if (m.checkpoint >= RACE_LOOP.length) {
          m.checkpoint = 0;
          m.lap += 1;
          if (m.lap > job.laps) { complete(); return; }
          G.hud?.say(speakerName(job), `Putaran ${m.lap} dari ${job.laps}. Terus gas!`);
        }
      }
      // Rival racers follow the same loop; position is by progress.
      if (m.rival?.racers) {
        let playerProgress = (m.lap - 1) * RACE_LOOP.length + m.checkpoint;
        let ahead = 0;
        for (const r of m.rival.racers) {
          const target = RACE_LOOP[r.cp];
          const want = Math.atan2(target.x - r.x, target.z - r.z);
          let dh = want - r.heading;
          while (dh > Math.PI) dh -= Math.PI * 2;
          while (dh < -Math.PI) dh += Math.PI * 2;
          r.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
          r.x += Math.sin(r.heading) * r.speed * dt;
          r.z += Math.cos(r.heading) * r.speed * dt;
          r.mesh.position.set(r.x, 0, r.z);
          r.mesh.rotation.y = r.heading;
          if (Math.hypot(r.x - target.x, r.z - target.z) < 12) {
            r.cp += 1;
            if (r.cp >= RACE_LOOP.length) { r.cp = 0; r.lap += 1; }
          }
          const rp = (r.lap - 1) * RACE_LOOP.length + r.cp;
          if (rp > playerProgress) ahead += 1;
        }
        m.racePos = ahead + 1;
      }
    }
  }

  function currentTarget() { return m.active ? m.objective : null; }

  return { state: m, startJob, update, retry, nextJob, complete, fail, onRoadblockSmashed, currentTarget };
}
