import * as THREE from "three";
import CityScene from "./CityScene";
import { FirstPersonControls } from "./FirstPersonControls";

const uiExpander = document.getElementById("expander") as HTMLDivElement;
const uiContent = document.getElementById("content") as HTMLDivElement;
const radioCameraFree = document.getElementById("radioCameraFree") as HTMLInputElement;
const radioCameraFollow = document.getElementById("radioCameraFollow") as HTMLInputElement;
const buttonCameraNextCar = document.getElementById("buttonCameraNextCar") as HTMLButtonElement;
const buttonCameraReset = document.getElementById("buttonCameraReset") as HTMLButtonElement;

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

const controls = new FirstPersonControls(camera, renderer.domElement);

const scene = new CityScene(camera);
scene.initialize();
resetCamera();

uiExpander.addEventListener("click", () => {
  if (uiExpander.classList.contains("expanded")) {
    uiExpander.classList.remove("expanded");
    uiContent.classList.remove("expanded");
  } else {
    uiExpander.classList.add("expanded");
    uiContent.classList.add("expanded");
  }
});
addEventListener("resize", onWindowResize);
radioCameraFree.addEventListener("click", () => scene.setCameraModeFree());
radioCameraFollow.addEventListener("click", () => scene.setCameraModeFollow());
buttonCameraNextCar.addEventListener("click", () => {
  if (!radioCameraFollow.checked) radioCameraFollow.checked = true;
  scene.cameraFollowNextCar()
});
buttonCameraReset.addEventListener("click", resetCamera);

tick();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetCamera() {
  scene.setCameraModeFree();
  radioCameraFree.checked = true;
  camera.position.set(0, 12, 2);
  camera.lookAt(new THREE.Vector3(0, 0, 0.5));
}

function tick() {
  controls.update();
  scene.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
