import * as THREE from 'three';
import { COLORS } from '../core/constants';

const isTouch = matchMedia('(pointer: coarse)').matches;

// FIFA-style broadcast camera: a perspective view from high above one sideline,
// tilted down across the pitch (goals left/right), softly tracking the action.
// This intentionally departs from the art-doc's orthographic spec to get the
// "TV game" feel the design now calls for.
export class Scene {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private target = new THREE.Vector3(0, 0, 0);
  private orbit = true; // menu idle orbit
  private orbitAngle = 0;
  private zoom = 1; // dolly factor so narrow viewports still see the whole pitch

  // Broadcast placement: behind the -X sideline, elevated, tilted ~36° down.
  private static readonly BACK = 74;
  private static readonly HEIGHT = 54;
  private static readonly LOOK_LIFT = 3;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.shadowMap.enabled = !isTouch;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.sky, 180, 420);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2000);

    this.addLights();
    this.addBackdrop();
    this.resize();
    this.positionCamera();
    addEventListener('resize', () => this.resize());
  }

  private addLights() {
    const amb = new THREE.AmbientLight(COLORS.ambient, 0.9);
    this.scene.add(amb);

    const sun = new THREE.DirectionalLight(COLORS.sun, 1.15);
    sun.position.set(30, 55, 18);
    if (!isTouch) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      const c = sun.shadow.camera;
      c.near = 1;
      c.far = 220;
      c.left = -90;
      c.right = 90;
      c.top = 90;
      c.bottom = -90;
    }
    this.scene.add(sun);
  }

  private addBackdrop() {
    // deep floor far below
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 1400),
      new THREE.MeshBasicMaterial({ color: COLORS.deepFloor }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -30;
    this.scene.add(floor);

    // ring of hills (cones) — read as distant stadium surroundings on the horizon
    const hillMat = new THREE.MeshLambertMaterial({ color: COLORS.hills });
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const r = 260 + Math.random() * 70;
      const h = 36 + Math.random() * 60;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(24 + Math.random() * 34, h, 6), hillMat);
      cone.position.set(Math.cos(a) * r, h / 2 - 28, Math.sin(a) * r);
      this.scene.add(cone);
    }

    // floating rocks
    const rockMat = new THREE.MeshLambertMaterial({ color: COLORS.rocks });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 170 + Math.random() * 130;
      const s = 3 + Math.random() * 6;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s), rockMat);
      rock.position.set(Math.cos(a) * r, 8 + Math.random() * 34, Math.sin(a) * r);
      this.scene.add(rock);
    }
  }

  setOrbit(on: boolean) {
    this.orbit = on;
    this.positionCamera();
  }

  // Soft-follow the centroid of the action during play (mostly horizontal pan).
  follow(cx: number, cz: number, dt: number) {
    if (this.orbit) return;
    const k = Math.min(1, dt * 2.5);
    // clamp so a goal never pans fully out of frame
    const tz = Math.max(-20, Math.min(20, cz));
    const tx = Math.max(-10, Math.min(10, cx));
    this.target.z += (tz - this.target.z) * k;
    this.target.x += (tx - this.target.x) * k;
    this.positionCamera();
  }

  private positionCamera() {
    if (this.orbit) {
      const R = 96;
      const H = 64;
      this.camera.position.set(
        this.target.x + Math.cos(this.orbitAngle) * R,
        H,
        this.target.z + Math.sin(this.orbitAngle) * R,
      );
      this.camera.lookAt(this.target.x, this.target.y, this.target.z);
    } else {
      this.camera.position.set(
        this.target.x - Scene.BACK * this.zoom,
        Scene.HEIGHT * this.zoom,
        this.target.z,
      );
      this.camera.lookAt(this.target.x, this.target.y + Scene.LOOK_LIFT, this.target.z);
    }
  }

  update(dt: number) {
    if (this.orbit) {
      this.orbitAngle += dt * 0.06;
      this.positionCamera();
    }
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // dolly back on narrow/portrait viewports so the whole pitch width fits
    this.zoom = Math.max(1, 1.85 / this.camera.aspect);
    this.camera.updateProjectionMatrix();
    this.positionCamera();
  }

  // Map a screen-space joystick vector (jx right+, jy up+) to a world ground
  // direction, using the live camera basis so steering matches what's on screen.
  screenToWorldDir(jx: number, jy: number): { x: number; z: number } {
    const m = this.camera.matrixWorld.elements;
    let rx = m[0];
    let rz = m[2]; // camera local X (right) on ground
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    // forward into the scene = -cameraLocalZ, projected to ground
    let fx = -m[8];
    let fz = -m[10];
    const fl = Math.hypot(fx, fz) || 1;
    fx /= fl;
    fz /= fl;
    return { x: rx * jx + fx * jy, z: rz * jx + fz * jy };
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
