import * as THREE from "three";
import { InputController } from "./InputController";

export class FirstPersonControls {
  camera: THREE.Camera;
  controller: InputController;
  phi: number = 0;
  theta: number = -0.45 * Math.PI; // -0.02; //
  rotation: THREE.Quaternion = new THREE.Quaternion();

  constructor(camera: THREE.Camera, target: HTMLCanvasElement) {
    this.camera = camera;
    this.controller = new InputController(target);
  }

  update() {
    this.updateRotation();
    this.updateTranslation();
  }

  updateTranslation() {
    const speed = 0.1;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.rotation);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.rotation);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.rotation);
    if (this.controller.keys.has("w")) this.camera.translateOnAxis(forward, speed);
    if (this.controller.keys.has("s")) this.camera.translateOnAxis(forward.negate(), speed);
    if (this.controller.keys.has("d")) this.camera.translateOnAxis(right, speed);
    if (this.controller.keys.has("a")) this.camera.translateOnAxis(right.negate(), speed);
    if (this.controller.keys.has("e")) this.camera.translateOnAxis(up, speed);
    if (this.controller.keys.has("q")) this.camera.translateOnAxis(up.negate(), speed);
  }

  updateRotation() {
    if (this.controller.leftButtonDown) {
      this.phi -= this.controller.movementX / window.innerWidth;
      this.theta -= this.controller.movementY / window.innerHeight;
      this.theta = Math.min(Math.max(this.theta, -0.5 * Math.PI), 0.5 * Math.PI);
    }
    this.controller.movementX = 0;
    this.controller.movementY = 0;

    const qx = new THREE.Quaternion();
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi);
    const qz = new THREE.Quaternion();
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta);
    this.rotation = new THREE.Quaternion();
    qx.multiply(qz);
    this.camera.rotation.setFromQuaternion(qx);
  }
}
