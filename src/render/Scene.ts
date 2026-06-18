import * as THREE from 'three';
import { COLORS, PITCH } from '../core/constants';

const isTouch = matchMedia('(pointer: coarse)').matches;

// Orthographic, high three-quarter top-down view per docs/ART-DIRECTION.md.
export class Scene {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;

  private halfHeight = 78;
  private target = new THREE.Vector3(0, 0, 0);
  private camOffset = new THREE.Vector3(48, 56, 48).normalize();
  private orbitAngle = 0;
  private orbit = true; // menu idle orbit

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    this.renderer.shadowMap.enabled = !isTouch;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.sky, 160, 340);

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.positionCamera();

    this.addLights();
    this.addBackdrop();
    this.resize();
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
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshBasicMaterial({ color: COLORS.deepFloor }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -30;
    this.scene.add(floor);

    // ring of hills (cones)
    const hillMat = new THREE.MeshLambertMaterial({ color: COLORS.hills });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 230 + Math.random() * 60;
      const h = 30 + Math.random() * 50;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(20 + Math.random() * 30, h, 6), hillMat);
      cone.position.set(Math.cos(a) * r, h / 2 - 28, Math.sin(a) * r);
      this.scene.add(cone);
    }

    // floating rocks
    const rockMat = new THREE.MeshLambertMaterial({ color: COLORS.rocks });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 150 + Math.random() * 120;
      const s = 3 + Math.random() * 6;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s), rockMat);
      rock.position.set(Math.cos(a) * r, 6 + Math.random() * 30, Math.sin(a) * r);
      this.scene.add(rock);
    }
  }

  setOrbit(on: boolean) {
    this.orbit = on;
    if (!on) {
      // restore the canonical 45° three-quarter framing for gameplay
      this.camOffset.set(48, 56, 48).normalize();
      this.positionCamera();
    }
  }

  // Soft-follow the centroid of the action during play.
  follow(cx: number, cz: number, dt: number) {
    if (this.orbit) return;
    this.target.x += (cx - this.target.x) * Math.min(1, dt * 2.5);
    this.target.z += (cz - this.target.z) * Math.min(1, dt * 2.5);
    this.positionCamera();
  }

  private positionCamera() {
    const dist = 140;
    this.camera.position.copy(this.target).addScaledVector(this.camOffset, dist);
    this.camera.lookAt(this.target);
  }

  update(dt: number) {
    if (this.orbit) {
      this.orbitAngle += dt * 0.06;
      const r = 1;
      this.camOffset.set(Math.cos(this.orbitAngle) * r, 1.18, Math.sin(this.orbitAngle) * r).normalize();
      this.positionCamera();
    }
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    // Fit the pitch: ensure both axes are visible.
    const needed = Math.max(PITCH.halfZ + 18, (PITCH.halfX + 18) / aspect);
    this.halfHeight = needed;
    this.camera.top = this.halfHeight;
    this.camera.bottom = -this.halfHeight;
    this.camera.left = -this.halfHeight * aspect;
    this.camera.right = this.halfHeight * aspect;
    this.camera.updateProjectionMatrix();
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
