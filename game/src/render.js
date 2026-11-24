// Three.js scene, chase camera and the objective beacon. The camera sits behind
// and above Reza (or his car) and looks slightly down the road ahead.
import { CFG } from './config.js';

const THREE = window.THREE;

export function createRender(G) {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CFG.palette.skyDay);
  scene.fog = new THREE.Fog(0x9fd0e8, 120, 420);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1200);

  const sun = new THREE.DirectionalLight(0xfff2c0, 1.1);
  sun.position.set(120, 180, 60);
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3f8f4f, 0.75);
  scene.add(hemi);

  // Objective beacon: a glowing column + a floating diamond over the target.
  const beacon = new THREE.Group();
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  column.position.y = 30;
  beacon.add(column);
  const diamond = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.6),
    new THREE.MeshBasicMaterial({ color: 0xffd23f }),
  );
  diamond.position.y = 12;
  beacon.add(diamond);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3, 4.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.15;
  beacon.add(ring);
  beacon.visible = false;
  scene.add(beacon);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function setTimeOfDay(hours, dusk) {
    // Day: bright blue sky, high sun. Dusk: orange sky, low warm sun.
    if (dusk || hours >= 18 || hours < 6) {
      scene.background.setHex(CFG.palette.skyDusk);
      scene.fog.color.setHex(0xe8a06a);
      sun.color.setHex(0xffb36b);
      sun.intensity = 0.85;
      sun.position.set(-140, 55, 80);
      hemi.intensity = 0.5;
    } else {
      scene.background.setHex(CFG.palette.skyDay);
      scene.fog.color.setHex(0x9fd0e8);
      sun.color.setHex(0xfff2c0);
      sun.intensity = 1.1;
      const t = (hours - 6) / 12; // 0 dawn .. 1 dusk
      sun.position.set(120 - t * 240, 180 - Math.abs(t - 0.5) * 60, 60);
      hemi.intensity = 0.75;
    }
  }

  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  let smoothHeading = 0;

  function update(dt, time) {
    const p = G.player.state;
    const inCar = p.inCar;
    const dist = inCar ? 11.5 : 8;
    const height = inCar ? 4.6 : 3.4;
    // Smooth the heading so the camera does not whip around.
    let dh = p.heading - smoothHeading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    smoothHeading += dh * Math.min(1, dt * 4);
    const fx = Math.sin(smoothHeading), fz = Math.cos(smoothHeading);
    camPos.set(p.x - fx * dist, height, p.z - fz * dist);
    // Keep the camera out of the ocean and above the ground.
    if (camPos.x > 336) camPos.x = 336;
    camTarget.set(p.x + fx * 8, 1.6, p.z + fz * 8);
    // After a teleport (screenshot re-staging) the camera may be a long way off:
    // snap it instead of lerping for a whole second at headless frame rates.
    if (camera.position.distanceTo(camPos) > 8) {
      camera.position.copy(camPos);
      smoothHeading = p.heading;
    } else {
      camera.position.lerp(camPos, Math.min(1, dt * 6));
    }
    camera.lookAt(camTarget);

    const target = G.missions?.currentTarget?.();
    if (target) {
      beacon.visible = true;
      beacon.position.set(target.x, 0, target.z);
      diamond.rotation.y += dt * 2;
      diamond.position.y = 12 + Math.sin(time * 2) * 1.2;
      ring.scale.setScalar(1 + Math.sin(time * 3) * 0.12);
    } else {
      beacon.visible = false;
    }
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, update, setTimeOfDay, resize };
}
