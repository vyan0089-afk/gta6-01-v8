// ARUNIKA — bootstrap and the one game loop.
// Boot order matters: hud.init() BEFORE missions.init() (missions.setJob calls
// HUD.say), and api.* BEFORE shots.stage() (stage uses game.player).
import { CFG } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createCrew } from './crew.js';
import { createAudio } from './audio.js';
import { createSave } from './save.js';
import { createInput, ACTION_ENTER, ACTION_PAUSE, ACTION_SAVE, ACTION_RETRY, ACTION_RADIO, ACTION_GARAGE } from './input.js';
import { createRender } from './render.js';
import { createHud } from './hud.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const auto = params.get('auto') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : CFG.game.seed;

const THREE = window.THREE;

// The shared game context every module reads from.
const G = {
  cfg: CFG,
  clock: { hours: 11.5, dusk: false, elapsed: 0 },
  rand: createRandom(seed),
  screen: 'menu',
  paused: false,
  over: false,
  time: 0,
};
window.__game = G;

const hud = createHud();
G.hud = hud;
hud.init(); // FIRST: missions.setJob calls HUD.say, which needs the HUD ready.

const render = createRender(G);
G.render = render;
G.scene = render.scene;
G.camera = render.camera;

G.world = createWorld(G);
G.player = createPlayer(G);
G.traffic = createTraffic(G);
G.police = createPolice(G);
G.missions = createMissions(G);
G.crew = createCrew(G);
G.audio = createAudio();
G.save = createSave(G);
G.input = createInput();

// One-shot keys the input module does not own: crew, weapons, garage, next job.
window.addEventListener('keydown', (event) => {
  if (event.repeat || G.screen !== 'play') return;
  const p = G.player.state;
  switch (event.code) {
    case 'KeyZ': G.crew.use('sari'); break;
    case 'KeyX': G.crew.use('bayu'); break;
    case 'KeyC': G.crew.use('lia'); break;
    case 'Digit1': p.weaponIdx = 0; break;
    case 'Digit2': p.weaponIdx = 1; break;
    case 'Digit3': p.weaponIdx = 2; break;
    case 'Digit4': p.weaponIdx = 3; break;
    case 'KeyN':
      if (G.missions.state.done) G.missions.nextJob();
      break;
    default: break;
  }
});

// Public API for the dossier / shots / debugging.
const api = {
  player: G.player,
  missions: G.missions,
  police: G.police,
  world: G.world,
  crew: G.crew,
  hud: G.hud,
  save: G.save,
  start: startGame,
  gameOver,
  state: () => ({
    money: G.player.state.money, rp: G.player.state.rp,
    wanted: G.player.state.wanted, job: G.missions.state.index,
    hours: G.clock.hours, screen: G.screen,
  }),
};
window.game = api;
G.gameOver = gameOver;

function gameOver() {
  if (G.over) return;
  G.over = true;
  G.screen = 'over';
  document.getElementById('gameover').classList.add('show');
  document.getElementById('hud').classList.add('dim');
  G.audio.setSiren(false);
  G.audio.fail();
}

function startGame(resume) {
  G.audio.resume();
  G.audio.startRadio();
  document.getElementById('menu').classList.remove('show');
  document.getElementById('gameover').classList.remove('show');
  document.getElementById('pause').classList.remove('show');
  document.getElementById('hud').classList.remove('dim');
  G.screen = 'play';
  G.over = false;
  if (resume) {
    const data = G.save.load();
    if (data) { G.save.apply(data); return; }
  }
  if (!G.missions.state.active && !G.missions.state.done) G.missions.startJob(0);
  G.hud.say('SARI', 'Reza! Akhirnya datang juga. Garasi di Pusat Kota — gas ke sana.');
}

function garageAction() {
  const p = G.player.state;
  const g = CFG.world.garage;
  if (Math.hypot(p.x - g.x, p.z - g.z) > g.radius) {
    G.hud.flash('Terlalu jauh dari garasi. Dekati garasi di Pusat Kota.');
    return;
  }
  const colors = [
    [0xff7a1a, 'ORANYE'], [0x1e6fd9, 'BIRU'], [0xd63031, 'MERAH'],
    [0x27ae60, 'HIJAU'], [0xf1c40f, 'KUNING'], [0x8e44ad, 'UNGU'], [0xecf0f1, 'PUTIH'],
  ];
  const idx = colors.findIndex(([c]) => c === p.carColor);
  const next = colors[(idx + 1) % colors.length];
  G.player.repaint(next[0], next[1]);
  G.audio.blip(880, 0.15);
  G.hud.say('BAYU', `Cat baru: ${next[1]}. Mobil mulus 100%, gratis buat kru.`);
  G.hud.banner('GARASI ARUNIKA', `Repaint ${next[1]} • Mobil diperbaiki 100%`);
}

function handleActions() {
  const actions = G.input.takeActions();
  if (actions & ACTION_SAVE) G.save.save();
  if (G.screen === 'menu') {
    if (actions & ACTION_ENTER) startGame(false);
    return;
  }
  if (G.screen === 'over') {
    if (actions & ACTION_ENTER) startGame(false);
    return;
  }
  if (actions & ACTION_PAUSE) {
    G.paused = !G.paused;
    document.getElementById('pause').classList.toggle('show', G.paused);
    return;
  }
  if (G.paused) return;
  if (actions & ACTION_ENTER) {
    if (G.player.state.inCar) G.player.exitCar();
    else G.player.enterCar();
  }
  if (actions & ACTION_RETRY) G.missions.retry();
  if (actions & ACTION_RADIO) {
    const st = G.audio.nextStation();
    G.hud.say('RADIO', `${st.name} — ${st.genre}.`);
  }
  if (actions & ACTION_GARAGE) garageAction();
}

let last = performance.now();
let accumulator = 0;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  handleActions();
  if (G.screen === 'play' && !G.paused) {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      step(STEP);
      accumulator -= STEP;
      steps += 1;
    }
    if (steps === 5) accumulator = 0;
  }
  G.render.update(Math.min(dt, 0.05), G.time);
  G.hud.update(G, Math.min(dt, 0.05));
}

function step(dt) {
  G.time += dt;
  G.clock.elapsed += dt;
  // In-game clock: 1 real minute = 12 game minutes.
  G.clock.hours += (dt / 60) * 0.2;
  if (G.clock.hours >= 24) G.clock.hours -= 24;
  const input = G.input.state();
  G.player.update(dt, input);
  G.traffic.update(dt);
  G.police.update(dt);
  G.missions.update(dt);
  G.crew.update(dt);
  G.audio.update(dt);
  G.audio.setEngine(G.player.state.inCar ? Math.abs(G.player.state.carSpeed) / CFG.tuning.carMax : 0, G.player.state.inCar && G.player.state.moving);
  G.audio.setSiren(G.player.state.wanted >= 2);
  // Slow health regen out of combat.
  const p = G.player.state;
  if (p.wanted === 0 && p.health < 100) p.health = Math.min(100, p.health + dt * 1.5);
}

// Menu wiring
document.getElementById('start-btn').addEventListener('click', () => startGame(false));
document.getElementById('continue-btn').addEventListener('click', () => startGame(true));
document.getElementById('resume-btn').addEventListener('click', () => {
  G.paused = false;
  document.getElementById('pause').classList.remove('show');
});
document.getElementById('restart-btn').addEventListener('click', () => startGame(false));
if (G.save.hasSave()) {
  document.getElementById('continue-btn').style.display = 'inline-block';
  const data = G.save.load();
  if (data) document.getElementById('menu-save').textContent = `Save ditemukan: $${data.money} • Job ${data.jobIndex + 1} • ${new Date(data.savedAt).toLocaleString('id-ID')}`;
}

if (shot) {
  // Screenshot mode: api.* is already set above, so stage() can use game.player.
  document.getElementById('menu').classList.remove('show');
  G.screen = 'play';
  stageShot(shot, G);
  if (auto) {
    // Hold W so the car rolls and the speedometer lives.
    G.input.pressForward(3);
  }
} else {
  document.getElementById('menu').classList.add('show');
}

requestAnimationFrame(frame);
