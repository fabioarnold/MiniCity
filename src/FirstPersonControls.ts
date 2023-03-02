import * as THREE from "three";
import { InputController } from "./InputController";

export class FirstPersonControls {
  camera: THREE.Camera;
  controller: InputController;

  constructor(camera: THREE.Camera, target: HTMLCanvasElement) {
    this.camera = camera;
    this.camera.rotation.order = "YXZ";
    this.controller = new InputController(target);
  }

  update() {
    this.updateRotation();
    this.updateTranslation();
  }

  updateTranslation() {
    const speed = this.controller.keys.has("shift") ? 0.2 : 0.04;
    const forward = new THREE.Vector3(0, 0, -1);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3(1, 0, 0);
    if (this.controller.keys.has("w")) this.camera.translateOnAxis(forward, speed);
    if (this.controller.keys.has("s")) this.camera.translateOnAxis(forward.negate(), speed);
    if (this.controller.keys.has("d")) this.camera.translateOnAxis(right, speed);
    if (this.controller.keys.has("a")) this.camera.translateOnAxis(right.negate(), speed);
    if (this.controller.keys.has("e")) this.camera.translateOnAxis(up, speed);
    if (this.controller.keys.has("q")) this.camera.translateOnAxis(up.negate(), speed);
  }

  updateRotation() {
    const speed = 0.03;
    if (this.controller.keys.has("arrowup")) this.camera.rotation.x += speed;
    if (this.controller.keys.has("arrowdown")) this.camera.rotation.x -= speed;
    if (this.controller.keys.has("arrowleft")) this.camera.rotation.y += speed;
    if (this.controller.keys.has("arrowright")) this.camera.rotation.y -= speed;
    if (this.controller.leftButtonDown) {
      this.camera.rotation.y -= this.controller.movementX * 0.002;
      this.camera.rotation.x -= this.controller.movementY * 0.002;
    }
    this.controller.movementX = 0;
    this.controller.movementY = 0;
    this.camera.rotation.x = Math.min(Math.max(this.camera.rotation.x, -0.5 * Math.PI), 0.5 * Math.PI);
  }
}
