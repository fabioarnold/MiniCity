import * as THREE from "three";
import CityScene from "./CityScene";
import { FirstPersonControls } from "./FirstPersonControls";

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
