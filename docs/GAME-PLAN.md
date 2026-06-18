# DRIFT·BALL — Game & Web App Plan

> Football-mode game built on the **DRIFT·SUMO** art direction (`docs/ART-DIRECTION.md`).
> This is the working design/implementation plan. Status: draft, pre-implementation.

## Context

The repo started with only `docs/ART-DIRECTION.md` — a look-and-feel spec for a top-down,
orthographic, low-poly toy-car **sumo** brawl. The goal is a **mobile web football game** that
**reuses that exact art direction and physics feel**, but changes the verb from "shove cars
off a ring" to "drive low-poly cars to knock a ball into the opponent's goal" — Rocket League–
style, but **strictly ground-based (no jump, no fly)**.

Requirements:
- **1v1 and 2v2** matches vs **AI bots** (no online play; fully static).
- Win on **best-of-3 goals** *or* highest score at the **5-minute timer**; tie → short
  golden-goal sudden death.
- **Virtual joystick + boost button** touch controls.
- **Three.js + TypeScript + Vite**, deployed to **GitHub Pages**.

## Locked decisions

| Topic | Decision |
|------|----------|
| Opponents | AI bots only (1v1 & 2v2), 3 difficulty levels. No online/multiplayer. |
| Controls | Virtual joystick (steer/throttle) + boost button; brake/reverse button. Ball moved by ramming (no kick button). Keyboard fallback on desktop. |
| Ball | **Player never controls the ball.** Pure-physics object — moved only by collisions with cars/walls. **Sized like a car** (big chunky ball). Has **real low vertical bounces** (3D: gravity + floor restitution, low arcs, can sail over a low car). Car↔ball mass ratio left as a **tunable** (dialed in during milestone 4). |
| Stack | Three.js + TypeScript + Vite |
| Deploy | GitHub Pages (static `dist/`), via GitHub Actions or `gh-pages` branch |
| Win rule | First to 3 goals, or higher score at 5:00; tie → golden goal (hard cap ~90s → draw) |
| Branding | **DRIFT·BALL** (revertible to DRIFT·SUMO) |

---

## 1. Game concept & rules

**One-liner:** Tilted orthographic neon-dusk arena; chunky matte toy cars push a glowing ball
into the enemy goal. Same world, palette, fog, and weighty drift feel as the sumo spec — re-
themed from a shrinking ring to a **rectangular pitch with two goals**.

**Match flow**
- Modes: **1v1** and **2v2** (player + AI teammate vs AI team).
- Win: first team to **3 goals**, OR highest score at **5:00**.
- Tie at full time → **golden goal** sudden death (first goal wins; hard cap → draw).
- After each goal: celebration banner + **kickoff reset** (cars to spawns, ball to center,
  3-2-1 countdown).
- Difficulty: Easy / Normal / Hard (AI reaction time, prediction, boost usage).

**Arena (re-themed from the ring)**
- Fixed **rounded-rectangle pitch** (extruded slab) floating in the dusk void; same kerb /
  edge-line / center-mark treatment as the ring.
- **Two goals** at the short ends. Because the ball is car-sized, goals are **generously wide
  and tall** (mouth comfortably bigger than the ball — roughly 2–2.5× ball diameter wide):
  gold `#ffd93d` posts + hot-pink `#ff3d6e` goal-line glow + suggested back net (thin unlit
  bars). A goal-trigger volume sits behind each line and is **tall enough to catch a ball
  arriving on a low bounce** (crossbar set above the ball's typical arc apex).
- **Perimeter walls** (reuse obstacle "wall" style) keep the ball in play — ball/cars bounce
  off them. Walls are bouncier for the ball than for cars so rebounds stay lively.
- Pitch is **scaled up to suit the big ball** — long enough that a car-sized ball doesn't
  cross it in one shove, with room for cars to maneuver around it.
- Floor tinted to distinguish the pitch (e.g. green-tinted disc per art doc map identity).

**The ball (new hero object) — pure physics, car-sized**
- **The player never controls the ball.** There is no possession, no assist, no kick — the
  ball moves *only* as a result of physics collisions (car↔ball, ball↔wall) plus a little
  bounce. The entire game verb is "position your car and ram the ball."
- **Size:** roughly the **dimensions of a car** (diameter ≈ car length, ~3.5–4.5 units) — a
  big, chunky, lightweight ball, not a small soccer ball. It reads as a hero object from the
  top-down ortho view.
- Low-poly faceted icosphere with a bright unlit/emissive-feel material so it glows like the
  kerbs. **Real but low bounces:** the ball has full 3D motion — gravity pulls it down and it
  bounces off the floor with restitution, producing **low arcs** that can sail over a low car.
  Arcs are kept deliberately low so the ball stays readable from the top-down ortho view and
  defensible. High restitution off cars and walls too; squash-and-stretch on impacts, a soft
  shadow/marker under an airborne ball so its ground position stays clear. Spins/rolls from the
  impulse direction; cream dust puff on hard hits, pink-tinted on a boosted ram.

---

## 2. Controls (touch-first, keyboard fallback)

- **Left thumb — virtual joystick:** sets intended heading/throttle; car accelerates toward
  the joystick direction. Steering authority scales with speed and eases to target (keeps the
  drifty, non-snappy feel). Release = coast (lateral velocity bleeds off via grip).
- **Right thumb — Boost button:** regenerating boost meter → forward speed burst (gold puff).
  Purely planar — no jump/flight.
- **Brake / reverse:** secondary right-side button; hold past ~0.8s engages reverse. Brake
  increases lateral scrub for brake-slides.
- **Ball interaction:** purely physical — **no kick button, no ball control whatsoever**. The
  ball only ever responds to collisions. You move/pass/shoot it by ramming with the car body
  (mass + restitution); boosting into it shoots it harder. All "skill" is in positioning and
  angles, not in any ball input.
- **Desktop fallback:** WASD/arrows steer, Shift = boost, Space = brake. Same physics.
- On-screen controls: thumb-anchored, large, translucent glass (art doc §9), **hidden on
  desktop**. Left/right-handed swap in settings.

---

## 3. Physics & feel (reuse sumo model, retuned)

- Forward/lateral velocity split + **grip** coefficient for arcade drift.
- **Mass-based impulse collisions** for car↔car and car↔ball; restitution tuned so the
  car-sized ball *pops* off the car. Minimum approach speed so slow nudges still move the ball.
- **Ball is pure physics, never player-driven.** Car-sized; **car↔ball mass ratio is a tunable
  parameter** (dialed in during milestone 4 — start light so cars throw it around, adjust by
  feel). **High restitution / "bouncy"** off cars and walls; rolling/air friction so it
  settles; capped speed to stay readable. Tune so it ricochets lively but doesn't cross the
  whole pitch in one hit.
- **Ball has real 3D motion (low bounces).** Gravity acts on the ball and it bounces off the
  floor with restitution, giving **low arcs** that can sail over a low car. Car↔ball collisions
  are resolved in 3D (the ball's height matters — a car only strikes the ball when their bodies
  actually overlap in height), so balls can pass over or be struck low. Vertical bounce
  restitution and gravity are tuned to keep arcs **low and brief**, not Rocket-League-aerial.
- **Cars remain strictly planar** — no ramps/jumps/pits/fall-off/tumble, cars never leave the
  ground (honors "no jump, no fly"). Only the *ball* uses the vertical axis.
- Boost = bounded forward acceleration with cooldown/regen.
- Fixed-timestep physics (~60 Hz accumulator) decoupled from render for determinism.

---

## 4. AI bots

- **Behavior:** lightweight per-bot state machine — *Chase ball → Position to strike toward
  enemy goal → Defend own goal when ball is on our half → Recover/return*. Aim at a strike
  point behind the ball relative to the target goal; boost when far/clear. Bots target the
  ball's **ground (projected) position** and account for low bounces — when the ball is
  airborne they move to its predicted landing spot rather than chasing thin air.
- **Difficulty knobs:** reaction delay, aim error, prediction lookahead, boost frequency.
- **2v2 roles:** attacker/defender split with rotation so bots don't stack on the ball.
- Bots feed the **same control vector** (joystick dir + boost/brake flags) as the player → one
  shared movement/physics code path.

---

## 5. Web app structure & menus

Single-page app; screens are overlay layers over the live 3D arena (idle orbit camera behind
UI). Glassy neon arcade UI register (art doc §9): bold italic headlines, translucent rounded
panels, fade+slide transitions.

1. **Title / Main Menu** — logo (`DRIFT·BALL`), Play, Garage, Settings, How to Play.
2. **Mode select** — 1v1 / 2v2, then Difficulty (Easy/Normal/Hard).
3. **Garage / car select** — pick car color/cosmetic (art doc §5); orbit showcase camera.
4. **Match HUD** — team scores + goal pips, match timer, boost meter, joystick + boost/brake
   buttons, kickoff countdown, goal banner.
5. **Pause** — Resume / Restart / Quit (auto-pause on tab blur / app background).
6. **Result** — Win/Lose banner, final score, Rematch / Change mode / Main menu.
7. **Settings** — master/SFX volume (synth Web Audio, art doc §8), control size/handedness,
   shadows on/off, reduced-motion.
8. **How to Play** — quick control + rules card.

Persist settings + chosen car + best results in `localStorage`.

---

## 6. Tech architecture & file layout

Three.js + TypeScript + Vite.

```
drift-ball/
├─ index.html                # mount, fonts, mobile viewport (no-zoom)
├─ package.json              # vite, three, typescript (+ gh-pages if used)
├─ tsconfig.json
├─ vite.config.ts            # base path for GitHub Pages (see §7)
├─ public/                   # favicon, manifest, og image
├─ docs/                     # ART-DIRECTION.md (source of truth) + this plan
└─ src/
   ├─ main.ts                # bootstrap: renderer, loop, screen manager
   ├─ core/
   │  ├─ Game.ts             # match state machine (kickoff/play/goal/result), timer, score
   │  ├─ Loop.ts             # fixed-timestep accumulator + render hook
   │  └─ Input.ts            # unified control vector (joystick/keys) → {steer, boost, brake}
   ├─ render/
   │  ├─ Scene.ts            # ortho camera, sun+ambient, fog, background hills/rocks
   │  ├─ Arena.ts            # pitch slab, walls, goals, kerb/edge/center
   │  ├─ Car.ts              # stacked-box car factory + cosmetics + brake lights/aura
   │  └─ Ball.ts             # glowing car-sized icosphere + spin + squash/bounce juice
   ├─ physics/
   │  ├─ World.ts            # integrator: planar cars + 3D ball (gravity, floor bounce), walls
   │  ├─ collide.ts          # car↔car, 3D car↔ball (height-aware), car/ball↔wall impulses
   │  └─ goal.ts             # goal volume trigger (height-aware, catches low-bounce shots)
   ├─ ai/Bot.ts              # state machine producing the same control vector
   ├─ fx/
   │  ├─ Particles.ts        # pooled cream/pink/gold dust puffs
   │  └─ Audio.ts            # synthesized Web Audio (thuds, whoosh, countdown, goal, fanfare)
   ├─ ui/
   │  ├─ ScreenManager.ts    # overlay screen routing + transitions
   │  ├─ screens/*.ts        # Title, ModeSelect, Garage, HUD, Pause, Result, Settings, HowTo
   │  └─ TouchControls.ts    # joystick + boost/brake widgets
   ├─ state/Store.ts         # settings/car/results persistence (localStorage)
   └─ styles/                # CSS custom props from art doc §4/§9
```

Notes: player + bots share one movement path; palette/typography as CSS custom properties
matching art doc tokens; pixel ratio capped at 2, AA on, shadows desktop-only.

---

## 7. GitHub Pages deployment

- **`vite.config.ts`:** `base: './'` (relative) so assets resolve under
  `https://<user>.github.io/<repo>/`.
- **Deploy (pick one):**
  1. **GitHub Actions (recommended):** `.github/workflows/deploy.yml` runs
     `npm ci && npm run build`, uploads `dist/` as a Pages artifact, deploys via
     `actions/deploy-pages`. Pages source = "GitHub Actions". Auto-deploy on push to `main`.
  2. **`gh-pages` branch:** `gh-pages` dev dep + `"deploy": "gh-pages -d dist"`; Pages source =
     `gh-pages` branch.
- Add `.nojekyll` so `_`-prefixed files survive.
- Mobile `index.html` (`viewport user-scalable=no`, `theme-color`, optional PWA manifest).
- Repo, remote (`origin` → drift-ball), and Claude GitHub app are already set up.

---

## 8. Build milestones

1. **Scaffold:** Vite+TS+Three, `vite.config.ts` base path, CSS tokens, deploy workflow →
   confirm blank scene deploys to Pages.
2. **World:** ortho camera, lighting, fog, background, pitch slab + walls + two goals.
3. **Car + input:** stacked-box car, joystick/keyboard input, drift physics, boost meter.
4. **Ball + collisions:** glowing ball, car↔ball/wall impulses, goal-line trigger + reset.
5. **Match loop:** score, 5-min timer, best-of-3, kickoff countdown, golden goal, result.
6. **AI bots:** chase/strike/defend state machine; difficulty; 2v2 roles.
7. **Menus/UX:** all screens, transitions, garage select, settings, localStorage.
8. **Juice:** particles, synth audio, banners, brake lights/aura, polish & mobile tuning.

---

## 9. Verification

- **Local:** `npm run dev`; test desktop (keyboard) and touch (device/responsive). Confirm
  joystick steers, boost bursts, ramming moves the ball, goals score + reset, timer/best-of-3
  end correctly, golden goal on tie, pause on tab blur, settings/car persist. Confirm **cars
  never leave the ground** (no jump/fly) while the **ball does bounce in low arcs** and can
  sail over a low car; low-bounce shots into the goal still score.
- **AI:** each difficulty in 1v1 & 2v2 — bots chase, shoot the correct goal, defend, don't
  stack in 2v2.
- **Performance:** 60fps + capped pixel ratio on a mid phone; shadows off on touch.
- **Build/deploy:** `npm run build` + `npm run preview` to validate the prod bundle with the
  Pages base path; push and confirm the live URL plays on a real phone.
- **Art fidelity:** spot-check palette, fog, ortho framing, typography, dust/audio vs
  `docs/ART-DIRECTION.md`.
