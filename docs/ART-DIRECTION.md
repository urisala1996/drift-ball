# DRIFT·SUMO — Look & Feel Spec

A portable description of how this game *looks, reads, and behaves* — enough to rebuild
the same aesthetic and physical character in another engine without studying the source.
Controls are intentionally omitted.

---

## 1. One-line identity

A **top-down, orthographic, low-poly toy-car sumo brawl** set on a glowing purple disc
floating in a dusk-violet void. Chunky boxy cars shove each other off a shrinking ring.
The mood is **playful, punchy, neon-at-dusk** — arcade, not simulation.

---

## 2. Camera

- **Projection: orthographic** (not perspective). This is the single most defining visual
  choice — parallel lines stay parallel, the scene reads like a tilted board game / diorama.
- **Angle:** high three-quarter top-down. Camera sits up and back, looking down at the
  origin. In this build the position is `(48, 56, 48)` looking at `(0,0,0)` — roughly a
  **35–40° downward tilt**, rotated 45° around so cars cast legible side shadows.
- **Ortho frustum half-height ≈ 50 world units** at rest; the projection box is sized by
  aspect ratio so it never distorts on resize.
- **Gameplay framing:** camera softly follows the **centroid of living cars** (lerped, not
  rigid) and **zooms with the arena** — as the ring shrinks, the view tightens; the zoom is
  clamped so small arenas don't over-zoom. Follow + zoom are eased (`lerp ≈ dt*2–3`), never
  snapped.
- **Menu/idle framing:** a slow automatic **orbit** around the arena (≈0.06 rad/s) at a
  fixed height, so the 3D world is always alive behind the UI.
- **Showcase framing (car preview):** camera **orbits a fixed car** with user-controllable
  yaw/pitch/zoom/pan; ortho half-height drives zoom (5–18 units). Pitch clamped ~0.12–1.35 rad.

**To replicate elsewhere:** use an orthographic camera tilted ~35° from top-down, rotated
45° in yaw, easing toward the action's center and scaling its frustum to the play area.

---

## 3. Render style

- **Engine register:** flat **low-poly**. Everything is built from primitives — boxes,
  cylinders, cones, dodecahedrons, extruded triangles. No textures, no normal maps, no PBR.
- **Materials:** almost entirely **Lambert (diffuse-only, matte)**. No specular, no
  metalness, no roughness maps. A few **unlit/basic** materials are used for things that
  should "glow" flat regardless of light: ring edge line, center mark, brake lights,
  power-up auras, pit voids, smoke puffs.
- **Antialiasing on**, pixel ratio capped at 2.
- **Soft shadows on desktop** (PCF soft, 1024² map from the single sun), **shadows off on
  touch devices** — from the top-down ortho view they read faintly and cost the most, so
  they're a desktop-only nicety.
- **Atmosphere:** linear **fog** in the background color from ~160 to ~340 units, so the
  surrounding hills fade into the void rather than ending hard.
- **No post-processing** (no bloom, no SSAO, no color grading). The "glow" is faked purely
  by using bright unlit materials against a dark matte background.

**To replicate elsewhere:** matte flat-shaded primitives + one warm directional sun + soft
ambient + fog; reserve unlit/emissive-looking materials for accents only.

---

## 4. Color palette

A **dusk-violet world with warm + neon accents.** Cool purple base, warm sun, hot-pink and
mint pop colors.

### Environment
| Role | Hex | Notes |
|------|-----|-------|
| Sky / background / fog | `#2a1e4f` | deep dusk violet — the whole void |
| Deep floor plane | `#1c1340` | darker violet far below |
| Backdrop hills | `#3a2d6b` | merged cones on the horizon |
| Backdrop rocks | `#7a6aa8` | floating lavender dodecahedrons |
| Ring platform top | `#3d3170` | the disc you fight on (map-tinted) |
| Ring skirt (side) | `#2b2150` | |
| Ring edge line | `#f5ead7` | warm off-white "paper", unlit |
| Center mark | `#ffd9a0` | warm cream |
| Curbs | alternating `#f5ead7` / `#ff3d6e` | racetrack white/red kerb ring |

### UI / brand (CSS custom properties)
| Token | Hex | Use |
|-------|-----|-----|
| `--ink` | `#1b1230` | near-black text on light chips |
| `--paper` | `#f5ead7` | primary off-white text/UI |
| `--sun` | `#ff8e3c` | warm orange — primary brand accent |
| `--hot` | `#ff3d6e` | hot pink/magenta — danger, emphasis |
| `--mint` | `#3ddbb4` | teal — secondary accent |
| `--sky` | `#2a1e4f` | matches 3D background |
| player slots | `#ff8e3c` / `#3ddbb4` / `#6c5ce7` / `#ffd93d` | orange / mint / violet / gold |

### Lighting
- **Ambient:** lavender `#8877cc` at intensity ~0.9 — fills shadows with cool purple so
  nothing goes black.
- **Sun (directional):** warm `#ffd9a0` at ~1.15, from high and to one side
  (`(30,55,18)`) — gives the warm/cool split that defines the mood.

**Palette in one breath:** cool violet base, warm cream highlights, neon pink + mint + gold
for everything that matters.

---

## 5. The cars (hero objects)

- Built from **stacked boxes**, ~2.4 × 0.9 × 4.4 units for the body:
  - **Body** box (the car's color).
  - **Cabin** box on top, dark violet `#241a44` (reads as tinted glass).
  - **Spoiler**: thin wide box on two little posts at the rear.
  - **Four wheels**: tall thin boxes, dark; front pair visibly steers.
  - **Brake lights**: two small **warm-yellow `#ffe066`** unlit boxes at the rear, only
    visible while braking.
- **Stock car colors:** orange `#ff8e3c`, mint `#3ddbb4`, hot-pink `#ff3d6e`, violet `#6c5ce7`.
- **Optional cosmetics** recolor body / glass / rims and add door-edge trim or a center
  racing stripe; a flat ring **aura** under the car lights up when a power-up is active.
- **Scale feel:** cars are deliberately **chunky and toy-like** — short, tall, rounded-read
  silhouettes, not sleek. They look like die-cast toys.

---

## 6. The arena & world

- **The ring:** a thick **cylinder disc** (radius starts at 36 units, shrinks to a 10-unit
  minimum over the round). Capped with a kerb ring of alternating white/red blocks, an unlit
  cream edge line, and a center dot. As it shrinks the whole group scales and the kerb
  re-lays itself.
- **Surrounding void:** the disc floats. Below is a vast dark plane; around it, a procedural
  ring of **low-poly cones (hills)** and scattered **floating dodecahedron rocks** that bob
  slowly. Fog blends them into the background. Nothing has hard edges against the sky.
- **Obstacles (per map), sharing the same palette:**
  - **Pillars:** violet `#5a4d95` cylinders with a hot-pink `#ff3d6e` cap.
  - **Walls:** violet `#4a3d85` boxes with a hot-pink cap.
  - **Ramps:** **gold `#ffd93d`** extruded right-triangle wedges (drive up, launch off).
  - **Pits:** near-black `#0a0814` disc + dark shaft, ringed by a glowing hot-pink lip.
- **Map identity is mostly the floor tint** — each map recolors the disc (browns for ramps,
  blue-grey for pillars, green for walls, plum for chaos) so they read distinct from above.

**Composition note:** a single brightly-lit object (the ring) centered in a dark, foggy,
sparsely-detailed surround. High contrast between the play surface and everything else.

---

## 7. Physics & motion feel

The handling is **arcade-drifty, weighty, and forgiving** — not a sim. Key characteristics
to reproduce the *feel*, with this build's tuning as reference:

- **Auto-accelerate:** cars drive forward on their own; the player only steers and brakes.
  Top speeds ~22–28 u/s, accel ~15–20 u/s². Deliberately moderate, not twitchy.
- **Drift model:** velocity is split into **forward** and **lateral** components each frame;
  lateral velocity bleeds off via a **grip** coefficient. Low grip = slidey, tail-out drift;
  high grip = planted. Braking *increases* lateral scrub (you can brake-slide).
- **Steering scales with speed** — almost no turn authority when nearly stopped, full
  authority once rolling. Steering input is itself eased toward its target (no instant snap).
- **Reverse:** holding brake past ~0.8s flips into active reverse (~40% of top speed).
- **Mass-based collisions:** car-car hits use impulse resolution with per-car **mass**
  (0.9–1.3) and a **high restitution (~1.8+)** so impacts *pop* — this is the core sumo
  verb. A minimum approach speed is enforced so even slow grinds produce a satisfying kick.
  Heavier cars shove lighter ones harder.
- **Obstacles** push the car out and **reflect velocity** with modest restitution (~0.3),
  spawning a dust puff and a thud.
- **Falling off** = lose: cross the ring edge (or center of car over a pit) and the car
  enters a **tumble** (spins on two axes, gravity ~55 u/s²) and drops into the void until
  it's far enough down to vanish.
- **Ramps / jumps:** a **ride-the-incline → launch-off-the-crest** model. The car's height
  sticks to the wedge surface going up; cresting the top with enough up-slope speed turns it
  into a **projectile** whose launch height **scales with speed** (gravity ~42 u/s² in air,
  light air-steering only). Nose **pitches up** on the ramp and in flight, **down** while
  falling. Lands on flat ground or another ramp.
- **The ring shrinks** on a timer (~40s to minimum), forcing cars together; once minimum,
  a **sudden-death** timer draws the round if nobody's been knocked out.

**Feel summary:** moderate speed, generous drift, *heavy* satisfying knock-back, gravity
present but exaggerated for arc and pop. Everything eases in/out; almost nothing snaps.

---

## 8. Effects & juice

- **Smoke/dust:** a pooled set of small semi-transparent cream `#f5ead7` boxes that spawn on
  **drift**, **braking**, **collisions** (pink-tinted on a heavy ram), **obstacle bumps**
  (warm `#ffd9a0`), **landings**, and **ramp launches** (gold). Each puff rises, scales up,
  and fades over ~0.6s. Drift smoke can take a custom color from cosmetics.
- **Brake lights** flick on only while braking.
- **Power-up aura:** a flat colored ring under the car while an effect is active.
- **Banners & countdown:** big italic, heavily letter-spaced display type with a hard drop
  shadow, rotated a few degrees — comic/arcade energy.
- **Audio (for completeness):** fully **synthesized Web Audio**, no asset files — thuds
  scaled by impact, fall whoosh, ramp-jump, countdown beeps, round ding, win/lose fanfare.

---

## 9. Typography & UI register

- **Font:** "Avenir Next" / "Segoe UI" / system sans — clean geometric sans.
- **Headlines:** very **bold (800–900), italic, tight or wide letter-spacing**, often with a
  hard `0 4px 0 rgba(0,0,0,.4)` drop shadow. The logo is heavy italic with colored accent
  glyphs (`·` in sun-orange, "SUMO" in hot-pink).
- **Body/labels:** small, bold, **wide letter-spacing (2–4px)**, lowered opacity (~0.6–0.85)
  — labels feel like racing-livery stencils.
- **Surfaces:** translucent white panels (`rgba(255,255,255,.06–.11)`) with thin light
  borders, **rounded 16–20px** corners, subtle blur, accent-colored top stripe per card.
- **Backgrounds:** radial gradient from a lighter violet `#43307a` at top to near-black
  `#150e2b` at the bottom; over the live 3D arena, a vignette darkens the edges.
- **Screen transitions:** quick fade + slide-up (`~0.28s`, ease-out cubic).
- **Overall UI vibe:** dark, glassy, neon-accented, arcade — confident and chunky, never thin
  or minimalist.

---

## 10. The five-second elevator pitch for an artist

> "Tilted orthographic board-game view of a glowing purple disc floating in a foggy dusk
> void. Chunky matte toy cars in neon orange/mint/pink/gold shove each other off the edge.
> Warm sun, cool purple shadows, flat low-poly everything, no textures. Bright unlit accents
> (kerbs, ramps, pit lips, smoke) pop against the dark. Big bold italic arcade type. Motion
> is weighty and drifty with exaggerated, satisfying knock-back."
