import * as THREE from 'three';

interface Puff {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
  grav: number;
}

// Pooled smoke/dust puffs. Each rises, scales up, and fades.
export class Particles {
  readonly group = new THREE.Group();
  private pool: Puff[] = [];
  private active: Puff[] = [];

  constructor(size = 60) {
    for (let i = 0; i < size; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0xf5ead7, transparent: true, opacity: 0 }),
      );
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({ mesh, life: 0, maxLife: 0.6, vx: 0, vy: 0, vz: 0, grav: 0 });
    }
  }

  spawn(x: number, z: number, color: number, scale = 1) {
    const p = this.pool.pop();
    if (!p) return;
    p.mesh.visible = true;
    p.mesh.position.set(x, 0.5, z);
    const s = (0.6 + Math.random() * 0.6) * scale;
    p.mesh.scale.setScalar(s);
    p.mesh.rotation.y = Math.random() * Math.PI;
    (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
    p.life = 0;
    p.maxLife = 0.5 + Math.random() * 0.2;
    p.vx = 0;
    p.vy = 2 + Math.random() * 2;
    p.vz = 0;
    p.grav = 0;
    this.active.push(p);
  }

  // Celebratory fireworks burst at a point in the air: sparks fly outward and
  // arc back down. Used at the net when a goal is scored.
  firework(x: number, y: number, z: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const p = this.pool.pop();
      if (!p) return;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      const s = 0.5 + Math.random() * 0.5;
      p.mesh.scale.setScalar(s);
      p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = 0.95;
      const ang = Math.random() * Math.PI * 2;
      const spd = 6 + Math.random() * 12;
      p.vx = Math.cos(ang) * spd;
      p.vz = Math.sin(ang) * spd;
      p.vy = 6 + Math.random() * 12;
      p.grav = 26;
      p.life = 0;
      p.maxLife = 0.7 + Math.random() * 0.4;
      this.active.push(p);
    }
  }

  burst(x: number, z: number, color: number, count: number, scale = 1) {
    for (let i = 0; i < count; i++) {
      this.spawn(x + (Math.random() - 0.5) * 2, z + (Math.random() - 0.5) * 2, color, scale);
    }
  }

  update(dt: number) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life += dt;
      const t = p.life / p.maxLife;
      p.vy -= p.grav * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.grav === 0) p.mesh.scale.addScalar(dt * 2);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = (p.grav > 0 ? 0.95 : 0.7) * (1 - t);
      if (t >= 1) {
        p.mesh.visible = false;
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
  }
}
