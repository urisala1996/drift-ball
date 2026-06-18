import * as THREE from 'three';
import { COLORS, PITCH } from '../core/constants';

// Builds the pitch slab, perimeter walls (with goal openings), goals, kerbs,
// and field lines. Returns a group to add to the scene.
export function buildArena(): THREE.Group {
  const g = new THREE.Group();
  const W = PITCH.halfX;
  const Z = PITCH.halfZ;

  // pitch slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(W * 2 + 4, 3, Z * 2 + 4),
    new THREE.MeshLambertMaterial({ color: COLORS.pitchTop }),
  );
  slab.position.y = -1.5;
  slab.receiveShadow = true;
  g.add(slab);

  // skirt (slightly larger darker box underneath)
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(W * 2 + 8, 6, Z * 2 + 8),
    new THREE.MeshLambertMaterial({ color: COLORS.pitchSkirt }),
  );
  skirt.position.y = -4;
  g.add(skirt);

  // field lines (unlit cream)
  const lineMat = new THREE.MeshBasicMaterial({ color: COLORS.edgeLine });
  addLine(g, lineMat, 0, 0, W * 2, 0.4); // halfway line (across X)
  // center circle
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.2, 40), lineMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);
  // center dot
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), new THREE.MeshBasicMaterial({ color: COLORS.centerMark }));
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = 0.07;
  g.add(dot);

  // perimeter edge lines
  addLine(g, lineMat, 0, Z, W * 2, 0.4);
  addLine(g, lineMat, 0, -Z, W * 2, 0.4);
  addLineZ(g, lineMat, W, 0, Z * 2, 0.4);
  addLineZ(g, lineMat, -W, 0, Z * 2, 0.4);

  // walls
  const wallMat = new THREE.MeshLambertMaterial({ color: COLORS.wall });
  const capMat = new THREE.MeshBasicMaterial({ color: COLORS.wallCap });
  // side walls (full length along Z)
  addWall(g, wallMat, capMat, W + 0.6, 0, 1.2, Z * 2);
  addWall(g, wallMat, capMat, -W - 0.6, 0, 1.2, Z * 2);
  // end walls split around the goal openings
  const sideLen = W - PITCH.goalHalfWidth;
  const sideCenter = PITCH.goalHalfWidth + sideLen / 2;
  for (const z of [Z + 0.6, -Z - 0.6]) {
    addWall(g, wallMat, capMat, sideCenter, z, sideLen, 1.2);
    addWall(g, wallMat, capMat, -sideCenter, z, sideLen, 1.2);
  }

  // goals
  g.add(buildGoal(Z + 0.6, 1));
  g.add(buildGoal(-Z - 0.6, -1));

  return g;
}

function addLine(g: THREE.Group, mat: THREE.Material, x: number, z: number, len: number, w: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.05, z);
  g.add(m);
}
function addLineZ(g: THREE.Group, mat: THREE.Material, x: number, z: number, len: number, w: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.05, z);
  g.add(m);
}

function addWall(
  g: THREE.Group,
  mat: THREE.Material,
  cap: THREE.Material,
  x: number,
  z: number,
  sx: number,
  sz: number,
) {
  const h = PITCH.wallHeight;
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat);
  body.position.set(x, h / 2, z);
  body.castShadow = false;
  g.add(body);
  const capMesh = new THREE.Mesh(new THREE.BoxGeometry(sx + 0.2, 0.5, sz + 0.2), cap);
  capMesh.position.set(x, h + 0.1, z);
  g.add(capMesh);
}

// Goal: posts + crossbar (gold) and a pink glowing goal-line + suggested net.
function buildGoal(z: number, dir: number): THREE.Group {
  const goal = new THREE.Group();
  const postMat = new THREE.MeshLambertMaterial({ color: COLORS.goalPost });
  const glowMat = new THREE.MeshBasicMaterial({ color: COLORS.goalGlow });
  const w = PITCH.goalHalfWidth;
  const h = PITCH.goalHeight;
  const depth = PITCH.goalDepth;

  for (const sx of [-w, w]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), postMat);
    post.position.set(sx, h / 2, z);
    goal.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + 0.8, 0.8, 0.8), postMat);
  bar.position.set(0, h, z);
  goal.add(bar);

  // glowing goal line on the ground
  const line = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, 1.2), glowMat);
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.08, z);
  goal.add(line);

  // suggested net: a few thin bars receding behind the line
  const netMat = new THREE.MeshBasicMaterial({ color: COLORS.goalGlow, transparent: true, opacity: 0.3 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(w * 2, h, 0.3), netMat);
  back.position.set(0, h / 2, z + dir * depth);
  goal.add(back);

  return goal;
}
