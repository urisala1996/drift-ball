import * as THREE from 'three';
import { CAR, COLORS } from '../core/constants';
import type { Car } from '../physics/Car';

// Stacked-box toy car. Front wheels visibly steer; brake lights flick on.
export class CarView {
  readonly group = new THREE.Group();
  private frontWheels: THREE.Mesh[] = [];
  private brakeLights: THREE.Mesh[] = [];

  constructor(color: number) {
    // Self-emissive keeps the neon body color true under the cool purple ambient.
    const bodyMat = new THREE.MeshLambertMaterial({
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.28),
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(CAR.bodyW, CAR.bodyH, CAR.bodyL), bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    this.group.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(CAR.bodyW * 0.8, 0.7, CAR.bodyL * 0.45),
      new THREE.MeshLambertMaterial({ color: COLORS.cabin }),
    );
    cabin.position.set(0, 1.3, -0.2);
    cabin.castShadow = true;
    this.group.add(cabin);

    // spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(CAR.bodyW, 0.15, 0.5), bodyMat);
    spoiler.position.set(0, 1.25, -CAR.bodyL / 2 + 0.2);
    this.group.add(spoiler);

    // wheels
    const wheelGeo = new THREE.BoxGeometry(0.4, 0.8, 1.0);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x161023 });
    const wx = CAR.bodyW / 2 + 0.05;
    const wz = CAR.bodyL / 2 - 1.0;
    for (const sx of [-wx, wx]) {
      for (const sz of [wz, -wz]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(sx, 0.4, sz);
        this.group.add(wheel);
        if (sz > 0) this.frontWheels.push(wheel);
      }
    }

    // brake lights
    const blMat = new THREE.MeshBasicMaterial({ color: COLORS.brakeLight });
    for (const sx of [-0.6, 0.6]) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.15), blMat);
      bl.position.set(sx, 0.7, -CAR.bodyL / 2 - 0.02);
      bl.visible = false;
      this.group.add(bl);
      this.brakeLights.push(bl);
    }

    // ground aura ring (boost indicator)
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(CAR.radius + 0.2, CAR.radius + 0.7, 24),
      new THREE.MeshBasicMaterial({ color: COLORS.dustBoost, transparent: true, opacity: 0 }),
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.05;
    aura.name = 'aura';
    this.group.add(aura);
  }

  sync(car: Car) {
    this.group.position.set(car.x, 0, car.z);
    this.group.rotation.y = car.yaw;
    for (const w of this.frontWheels) w.rotation.y = car.steer * 0.5;
    for (const b of this.brakeLights) b.visible = car.braking;
    const aura = this.group.getObjectByName('aura') as THREE.Mesh;
    const m = aura.material as THREE.MeshBasicMaterial;
    m.opacity += ((car.boosting ? 0.85 : 0) - m.opacity) * 0.2;
  }
}
