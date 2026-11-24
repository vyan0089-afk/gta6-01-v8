// The dense DOM HUD: mission panel, money/clock/stars/rank, APD dispatch feed,
// weapon slots, crew cards, live minimap, health/armour, dialogue, speedometer
// and radio — plus the start menu, pause and game-over screens.
import { CFG, rankFor, districtAt } from './config.js';

export function createHud() {
  let el = {};
  let sayTimer = 0;
  let bannerTimer = 0;
  let flashTimer = 0;
  let lastMinute = -1;

  function init() {
    const q = (id) => document.getElementById(id);
    el = {
      hud: q('hud'), mission: q('mission-panel'), missionTitle: q('mission-title'),
      missionBrief: q('mission-brief'), missionObj: q('mission-objective'),
      money: q('money'), clock: q('clock'), stars: q('stars'), rank: q('rank'),
      radioBanner: q('radio-banner'), dispatch: q('dispatch'), dispatchList: q('dispatch-list'),
      weapons: q('weapons'), crew: q('crew-cards'),
      minimap: q('minimap'), healthBar: q('health-bar'), armourBar: q('armour-bar'),
      healthText: q('health-text'), armourText: q('armour-text'),
      district: q('district'), dialog: q('dialog'), dialogSpeaker: q('dialog-speaker'),
      dialogText: q('dialog-text'), speed: q('speed'), radio: q('radio-station'),
      banner: q('banner'), bannerTitle: q('banner-title'), bannerSub: q('banner-sub'),
      flash: q('flash'), menu: q('menu'), gameover: q('gameover'),
      pause: q('pause'), resumeBtn: q('resume-btn'), startBtn: q('start-btn'),
      continueBtn: q('continue-btn'), restartBtn: q('restart-btn'),
      menuSave: q('menu-save'), carHealth: q('car-health'), carHealthBar: q('car-health-bar'),
      objective: q('objective-dist'),
    };
    // Crew cards
    el.crew.innerHTML = CFG.crew.map((c) => `
      <div class="crew-card" id="crew-${c.id}" style="--crew:${c.color}">
        <div class="crew-head"><span class="crew-name">${c.name}</span><span class="crew-role">${c.role}</span></div>
        <div class="crew-ability">${c.ability} <span class="crew-key">[${c.key}]</span></div>
        <div class="crew-desc">${c.desc}</div>
        <div class="crew-cd" id="crew-cd-${c.id}"></div>
      </div>`).join('');
    // Weapon slots
    el.weapons.innerHTML = CFG.weapons.map((w, i) => `
      <div class="weapon-slot" id="weapon-${i}">
        <span class="weapon-key">${w.key}</span>
        <span class="weapon-name">${w.name}</span>
        <span class="weapon-ammo" id="weapon-ammo-${i}">${w.ammo === Infinity ? '∞' : w.ammo}</span>
      </div>`).join('');
    return el;
  }

  function say(speaker, text) {
    if (!el.dialog) return;
    const c = CFG.crew.find((x) => x.name === speaker);
    el.dialogSpeaker.textContent = speaker;
    el.dialogSpeaker.style.color = c ? c.color : '#ffd23f';
    el.dialogText.textContent = text;
    el.dialog.classList.add('show');
    sayTimer = 6;
  }

  function banner(title, sub) {
    if (!el.banner) return;
    el.bannerTitle.textContent = title;
    el.bannerSub.textContent = sub || '';
    el.banner.classList.add('show');
    bannerTimer = 3.5;
  }

  function flash(text) {
    if (!el.flash) return;
    el.flash.textContent = text;
    el.flash.classList.add('show');
    flashTimer = 2;
  }

  function clearTransient() {
    if (el.flash) el.flash.classList.remove('show');
    if (el.banner) el.banner.classList.remove('show');
    flashTimer = 0; bannerTimer = 0;
  }

  function dispatch(title, text) {
    if (!el.dispatchList) return;
    const div = document.createElement('div');
    div.className = 'dispatch-line';
    div.innerHTML = `<b>${title}</b> ${text}`;
    el.dispatchList.prepend(div);
    while (el.dispatchList.children.length > 3) el.dispatchList.lastChild.remove();
    el.dispatch.classList.add('show');
  }

  function setMission(job, m) {
    if (!el.missionTitle) return;
    el.missionTitle.textContent = `JOB ${job.id} — ${job.title.toUpperCase()}`;
    el.missionBrief.textContent = job.brief;
  }

  function districtName() {
    return districtAt(window.__game?.player.state.x ?? 0, window.__game?.player.state.z ?? 0).name;
  }

  function drawMinimap(G) {
    const cv = el.minimap;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const S = cv.width; // 200
    const half = CFG.world.half;
    const toMap = (x, z) => [(x + half) / (half * 2) * S, (z + half) / (half * 2) * S];
    // Land
    ctx.fillStyle = '#2f6b3a'; ctx.fillRect(0, 0, S, S);
    // Sand + ocean (east)
    const [sx] = toMap(CFG.world.beachX, 0);
    ctx.fillStyle = '#e8d29a'; ctx.fillRect(sx, 0, S - sx, S);
    const [ox] = toMap(CFG.world.oceanX, 0);
    ctx.fillStyle = '#1e7fa8'; ctx.fillRect(ox, 0, S - ox, S);
    // Roads
    ctx.strokeStyle = '#3a3f46'; ctx.lineWidth = 2;
    for (const r of G.world.roads) {
      const [x1] = toMap(r, 0);
      ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, S); ctx.stroke();
      const [, z1] = toMap(0, r);
      ctx.beginPath(); ctx.moveTo(0, z1); ctx.lineTo(S, z1); ctx.stroke();
    }
    // Traffic (white)
    ctx.fillStyle = '#ffffff';
    for (const c of G.traffic.cars) {
      const [x, z] = toMap(c.x, c.z);
      ctx.fillRect(x - 1, z - 1, 2, 2);
    }
    // Police (red) — always when wanted, all of them while LIA's EYES OUT runs.
    const p = G.player.state;
    const showAll = G.crew.state.liaTimer > 0;
    ctx.fillStyle = '#ff2222';
    for (const u of G.police.units) {
      if (!u.active) continue;
      if (!showAll && Math.hypot(p.x - u.x, p.z - u.z) > 70) continue;
      const [x, z] = toMap(u.x, u.z);
      ctx.beginPath(); ctx.arc(x, z, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (G.police.heliActive) {
      const h = G.police.heliMesh.position;
      const [x, z] = toMap(h.x, h.z);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.arc(x, z, 4, 0, Math.PI * 2); ctx.fill();
    }
    // Objective (yellow diamond)
    const t = G.missions?.currentTarget?.();
    if (t) {
      const [x, z] = toMap(t.x, t.z);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x, z - 5); ctx.lineTo(x + 5, z); ctx.lineTo(x, z + 5); ctx.lineTo(x - 5, z);
      ctx.closePath(); ctx.fill();
    }
    // Player arrow (green)
    const [px, pz] = toMap(p.x, p.z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(Math.atan2(Math.sin(p.heading), Math.cos(p.heading)) + Math.PI);
    ctx.fillStyle = '#39ff6a';
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // North marker
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('N', 4, 12);
  }

  function update(G, dt) {
    if (!el.hud) return;
    const p = G.player.state;
    const m = G.missions.state;
    el.money.textContent = '$' + p.money.toLocaleString('en-US');
    const hh = Math.floor(G.clock.hours);
    const mm = Math.floor((G.clock.hours - hh) * 60);
    el.clock.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if (mm !== lastMinute) { lastMinute = mm; }
    const stars = '★'.repeat(p.wanted) + '☆'.repeat(5 - p.wanted);
    el.stars.textContent = stars;
    el.stars.className = p.wanted > 0 ? 'wanted-hot' : '';
    const rank = rankFor(p.rp);
    el.rank.textContent = `${rank.name} • ${p.rp} RP`;
    el.healthBar.style.width = p.health + '%';
    el.healthText.textContent = `HP ${Math.round(p.health)}`;
    el.armourBar.style.width = p.armour + '%';
    el.armourText.textContent = `ARMOUR ${Math.round(p.armour)}`;
    el.carHealthBar.style.width = p.carHealth + '%';
    el.carHealth.textContent = `MOBIL ${Math.round(p.carHealth)}% • ${p.carColorName}`;
    el.district.textContent = districtAt(p.x, p.z).name + (p.inCar ? ' • ' + CFG.player.carName : ' • JALAN KAKI');
    const kmh = Math.round(Math.abs(p.inCar ? p.carSpeed : p.speed) * 3.6);
    el.speed.textContent = kmh;
    const st = G.audio.currentStation();
    el.radio.textContent = `${st.name} — ${st.genre}`;
    el.radioBanner.textContent = `♪ ${st.name} • ${st.genre}`;
    // Mission objective line
    if (m.active) {
      const job = CFG.jobs[m.index];
      let line = '';
      const t = m.objective;
      if (t) {
        const d = Math.round(Math.hypot(p.x - t.x, p.z - t.z));
        line = `◈ ${d} m`;
      }
      if (job.type === 'timed') line += `  •  ⏱ ${Math.max(0, Math.ceil(m.timer))} dtk`;
      if (job.type === 'race') line += `  •  PUTARAN ${Math.min(m.lap, job.laps)}/${job.laps} • POS ${m.racePos}/3`;
      if (job.type === 'ram' && m.index === 2) line += `  •  REGENT ${Math.round(m.rivalHealth)}%`;
      if (m.message) line += ` — ${m.message}`;
      el.missionObj.textContent = line;
    } else if (m.done) {
      el.missionObj.textContent = 'Job selesai. Tekan N untuk job berikutnya.';
    } else if (m.failed) {
      el.missionObj.textContent = 'Job gagal. Tekan R untuk coba lagi.';
    }
    // Weapon slots
    CFG.weapons.forEach((w, i) => {
      const slot = document.getElementById(`weapon-${i}`);
      if (slot) slot.classList.toggle('active', i === p.weaponIdx);
      const ammo = document.getElementById(`weapon-ammo-${i}`);
      if (ammo) ammo.textContent = p.ammo[i] === Infinity ? '∞' : p.ammo[i];
    });
    // Crew cooldowns
    CFG.crew.forEach((c) => {
      const cd = document.getElementById(`crew-cd-${c.id}`);
      const card = document.getElementById(`crew-${c.id}`);
      if (!cd || !card) return;
      if (G.crew.state.cooldown > 0) {
        cd.textContent = `COOLDOWN ${Math.ceil(G.crew.state.cooldown)} dtk`;
        card.classList.add('cooling');
      } else {
        cd.textContent = 'SIAP';
        card.classList.remove('cooling');
      }
    });
    drawMinimap(G);
    if (sayTimer > 0) { sayTimer -= dt; if (sayTimer <= 0) el.dialog.classList.remove('show'); }
    if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) el.banner.classList.remove('show'); }
    if (flashTimer > 0) { flashTimer -= dt; if (flashTimer <= 0) el.flash.classList.remove('show'); }
  }

  return { init, say, banner, flash, clearTransient, dispatch, setMission, update, districtName };
}
