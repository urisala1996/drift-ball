import * as THREE from 'three';
import { BALL, COLORS } from '../core/constants';
import type { Ball } from '../physics/Ball';

// Glowing, car-sized faceted ball + a ground shadow marker so its ground
// position stays readable while it's airborne.
export class BallView {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private shadow: THREE.Mesh;
  private baseScale = 1;

  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BALL.radius, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.ball }),
    );
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // faint glow shell
    const glow = new THREE.Mesh(
      new THREE.IcosahedronGeometry(BALL.radius * 1.12, 1),
      new THREE.MeshBasicMaterial({ color: COLORS.ballGlow, transparent: true, opacity: 0.18 }),
    );
    this.mesh.add(glow);

    // ground shadow marker (separate, stays on the floor)
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(BALL.radius, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.04;
    this.group.add(this.shadow);
  }

  sync(ball: Ball) {
    this.mesh.position.set(ball.x, ball.y, ball.z);
    this.mesh.rotation.x = ball.spin;
    this.mesh.rotation.z = ball.spin * 0.6;

    // squash & stretch near the floor on impact
    const airH = Math.max(0, ball.y - BALL.radius);
    const squash = ball.vy < -8 && airH < 1 ? 0.85 : 1;
    this.mesh.scale.set(
      this.baseScale / squash,
      this.baseScale * squash,
      this.baseScale / squash,
    );

    // shadow tracks ground position, shrinks with height
    this.shadow.position.set(ball.x, 0.04, ball.z);
    const s = Math.max(0.4, 1 - airH / 30);
    this.shadow.scale.set(s, s, s);
  }
}
