[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/vyan0089-afk/gta6-01-v8/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/vyan0089-afk/gta6-01-v8/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# ARUNIKA — Pulau Arunika

Open-world crime di pulau tropis karangan. Reza baru keluar dari penjara dan pulau
ini milik siapa saja yang berani mengambilnya: sepuluh story job, wanted 0–5 bintang,
APD di darat dan Rajawali-1 di udara, dan satu mahkota di ujung balapan terakhir.

## Main

Buka `game/index.html` di browser desktop (atau `node serve.ts` lalu
http://localhost:8080). Tidak ada build, tidak ada network — Three.js sudah di-vendor
di `game/vendor/three.min.js`.

- **WASD** bergerak / mengemudi, **Shift** lari, **Space** handbrake, **E** masuk & keluar mobil
- **1–4** ganti senjata (FISTS, .38, SMG, AR-9)
- **Z** Sari — SWAP PLATES (turun 1 bintang), **X** Bayu — QUICK FIX (perbaiki mobil 100%),
  **C** Lia — EYES OUT (semua polisi di minimap 25 detik), cooldown 30 detik
- **G** di dekat garasi — repaint + perbaiki mobil 100%
- **M** ganti stasiun radio (SURYA 101.5 FM Island Pop, OMBO 98.4 FM Sunset Synth,
  ARUNIKA TALK 88.1), **F5** save, **P** jeda, **R** ulangi job, **N** job berikutnya

## Dunia

Pulau 680×680 m: lima distrik (Pantai Arunika, Kota Lama, Pelabuhan, Bukit Senja,
Pusat Kota), grid jalan dengan gedung berjendela, palem di tepi jalan dan deretan
palem di pantai, laut + pasir di timur, dermaga kayu dan mercusuar di selatan,
lampu jalan, mobil parkir, payung pantai. Lalu lintas 26 mobil dan 34 pejalan kaki
hidup di jalanan.

## Sistem

- **Wanted 0–5 bintang**: 1–2 bintang unit kejar, 3+ roadblock + helikopter Rajawali-1
  (orbit, searchlight). Wanted turun perlahan saat tidak terlihat APD.
- **10 story jobs**: Sopir Baru, Kurir Pantai, Kejar-Kejaran, Jalan Tikus, Blokir Jalan,
  Rajawali-1, Bank Arunika, Balap Jalanan, Pengejaran Terakhir, Raja Arunika.
- **Rank**: ROOKIE → STREET → DRIVER → FIXER → KING (0 / 400 / 1.200 / 2.600 / 5.000 RP).
- **HUD padat**: panel misi, uang + jam + bintang + rank, dispatch APD, slot senjata,
  kartu crew, minimap live, health/armour, dialog, speedometer + radio.
- **Save** ke localStorage (F5), menu menawarkan resume.

## Screenshot

`drive.jpg` (cover) — Reza di ARUNIKA GT di beach boulevard, wanted 3, helikopter
Rajawali-1 di depan, roadblock dan rival merah di jalan. `foot.jpg` — Reza jalan kaki
di Kota Lama. `garage.jpg` — repaint biru di garasi. `race.jpg` — Balap Jalanan saat senja.

## Struktur

- `game/index.html` — layout HUD + menu + game over
- `game/src/config.js` — nama, distrik, wanted, rank, crew, senjata, 10 jobs, tuning
- `game/src/world.js` — pulau 3D + mobil & helikopter low-poly
- `game/src/player.js` — jalan kaki + mengemudi (mobil selalu di-render)
- `game/src/traffic.js` — lalu lintas + pejalan kaki
- `game/src/police.js` — unit APD, roadblock, helikopter
- `game/src/missions.js` — 10 jobs sebagai state machine
- `game/src/crew.js`, `audio.js`, `save.js`, `input.js`, `render.js`, `hud.js`, `shots.js`, `main.js`
- `main.ts` — copy game/ + screenshots/ ke /output, tulis dossier.json
- `vendor/makefun-game.ts` — library kit make.fun (byte-identik dengan kit)

MIT License — lihat `LICENSE`.
