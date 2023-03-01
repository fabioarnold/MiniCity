import * as THREE from "three";
import CityScene from "./CityScene";

class InputController {
  target: HTMLCanvasElement;
  leftButtonDown: boolean = false;
  readonly keys = new Set<string>();
  movementX: number = 0;
  movementY: number = 0;

  constructor(target: HTMLCanvasElement) {
    this.target = target;
    this.init();
  }

  init() {
    this.target.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
    this.target.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
    this.target.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  onKeyDown(e: KeyboardEvent) {
    this.keys.add(e.key.toLowerCase());
  }

  onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.key.toLowerCase());
  }

  onMouseDown(e: MouseEvent) {
    this.onMouseMove(e);

    if (e.button === 0) {
      this.leftButtonDown = true;
      this.target.requestPointerLock();
    }
  }

  onMouseUp(e: MouseEvent) {
    this.onMouseMove(e);

    if (e.button === 0) {
      this.leftButtonDown = false;
      document.exitPointerLock();
    }
  }

  onMouseMove(e: MouseEvent) {
    this.movementX += e.movementX;
    this.movementY += e.movementY;
  }
}

class FirstPersonControls {
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

const canvas = document.getElementById("app") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor("lightblue");
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
// renderer.physicallyCorrectLights = true;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 2;
camera.position.y = 12; //* 0.1;
camera.lookAt(new THREE.Vector3(0, 0, 0.5));

const controls = new FirstPersonControls(camera, renderer.domElement);

const scene = new CityScene(camera);
scene.initialize();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

addEventListener("resize", onWindowResize);

function tick() {
  controls.update();
  scene.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

tick();
