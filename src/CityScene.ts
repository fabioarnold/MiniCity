import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const debug = true;

const carNames = [
  "firetruck",
  "ambulance",
  "delivery",
  "deliveryFlat",
  "garbageTruck",
  "hatchbackSports",
  "police",
  "sedan",
  "sedanSports",
  "suv",
  "suvLuxury",
  "taxi",
  "tractor",
  "tractorShovel",
  // "tractorPolice",
  "truck",
  "truckFlat",
  "van",
];

const attachCameraToCar = false;

enum Tile {
  None,
  Street,
  House,
}

enum Dir {
  N,
  E,
  S,
  W,
}

class Pos {
  row: number;
  col: number;

  constructor(row?: number, col?: number) {
    this.row = row ?? 0;
    this.col = col ?? 0;
  }

  clone(): Pos {
    return new Pos(this.row, this.col);
  }

  set(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  step(dir: Dir): this {
    if (dir === Dir.N) this.row -= 1;
    if (dir === Dir.E) this.col += 1;
    if (dir === Dir.S) this.row += 1;
    if (dir === Dir.W) this.col -= 1;
    return this;
  }
}

function flipDir(dir: Dir): Dir {
  return (dir + 2) % 4;
}

const blockSize = 3;
const numBlocks = debug ? 2 : 3;
const numRows = numBlocks * (1 + blockSize) + 1;
const numCols = numRows;
const numCars = debug ? 2 : 20;

class Car {
  object: THREE.Object3D;
  pos: Pos;
  dir: Dir = Dir.N;
  nextDir: Dir = Dir.N;
  speed: number = 0;
  distance: number = 0;
  tileBox: THREE.Box3;

  constructor(object: THREE.Object3D, pos: Pos) {
    this.object = object;
    this.pos = pos;
    this.object.position.set(this.pos.col, 0.01, this.pos.row);
    const minSpeed = 1.0 / 120.0;
    const maxSpeed = 1.0 / 20.0;
    this.speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
  }

  // -1: left turn, 0: going straight, 1: right turn
  getTurn(): number {
    let turn = this.nextDir - this.dir;
    if (turn > 1) turn -= 4;
    if (turn < -1) turn += 4;
    return turn;
  }
}

function getTurnDistance(turn: number): number {
  if (turn === -1) return 0.7 * 0.5 * Math.PI;
  else if (turn === 1) return 0.3 * 0.5 * Math.PI;
  return 1; // turn === 0
}

export default class CityScene extends THREE.Scene {
  private readonly gltfLoader = new GLTFLoader();

  private readonly camera: THREE.Camera;
  private carModels: THREE.Object3D[];

  private map: Tile[][];
  private cars: Car[];

  constructor(camera: THREE.Camera) {
    super();
    this.camera = camera;

    this.map = [];
    for (let row = 0; row < numRows; row++) {
      this.map[row] = [];
      for (let col = 0; col < numCols; col++) {
        this.map[row][col] = row % (blockSize + 1) === 0 || col % (blockSize + 1) === 0 ? Tile.Street : Tile.House;
      }
    }

    this.carModels = [];
    this.cars = [];
  }

  private getTile(row: number, col: number): Tile {
    if (row < 0 || col < 0 || row >= numRows || col >= numCols) return Tile.None;
    return this.map[row][col];
  }

  private async loadObject(url: string): Promise<THREE.Object3D> {
    const object = (await this.gltfLoader.loadAsync(url)).scene.children[0];
    object.traverse((child) => {
      // @ts-ignore
      if (child.material) child.material.metalness = 0;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return object;
  }

  async initialize() {
    const ambientLight = new THREE.AmbientLight("white", 0.15);
    const light = new THREE.DirectionalLight("white", 0.7);
    light.position.set(10, 10, 20);
    light.shadow.camera.left = -8;
    light.shadow.camera.right = 8;
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    // light.shadow.bias = -0.00008;

    this.add(ambientLight);
    this.add(light);

    // ground plane
    const geometry = new THREE.PlaneGeometry(numCols + 1, numRows + 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x339911 });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set(numCols / 2 - 0.5, 0, numRows / 2 - 0.5);
    plane.receiveShadow = true;

    this.carModels = await Promise.all(carNames.map((name) => this.loadObject("assets/cars/" + name + ".glb")));
    this.carModels.forEach((car) => car.scale.setScalar(0.15));
    const roadCrossroad = await this.loadObject("assets/roads/road_crossroadPath.glb");
    const roadBend = await this.loadObject("assets/roads/road_bend.glb");
    const roadIntersection = await this.loadObject("assets/roads/road_intersection.glb");
    const roadStraight = await this.loadObject("assets/roads/road_straight.glb");
    const roadEnd = await this.loadObject("assets/roads/road_endRound.glb");
    roadCrossroad.traverse((child) => (child.castShadow = false));
    roadBend.traverse((child) => (child.castShadow = false));
    roadIntersection.traverse((child) => (child.castShadow = false));
    roadStraight.traverse((child) => (child.castShadow = false));
    roadEnd.traverse((child) => (child.castShadow = false));
    const buildings = await Promise.all(
      ["A", "B", "C", "D", "F"].map((c) => this.loadObject("assets/buildings/small_building" + c + ".glb"))
    );

    // NESW
    const roads = [
      {}, // 0000
      { object: roadEnd, rotation: -0.5 * Math.PI }, // 1000
      { object: roadEnd, rotation: Math.PI }, // 0100
      { object: roadBend, rotation: 0 }, // 1100
      { object: roadEnd, rotation: 0.5 * Math.PI }, // 0010
      { object: roadStraight, rotation: 0.5 * Math.PI }, // 1010
      { object: roadBend, rotation: -0.5 * Math.PI }, // 0110
      { object: roadIntersection, rotation: -0.5 * Math.PI }, // 1110
      { object: roadEnd, rotation: 0 }, // 0001
      { object: roadBend, rotation: 0.5 * Math.PI }, // 1001
      { object: roadStraight, rotation: 0 }, // 0101
      { object: roadIntersection, rotation: 0 }, // 1101
      { object: roadBend, rotation: Math.PI }, // 0011
      { object: roadIntersection, rotation: 0.5 * Math.PI }, // 1011
      { object: roadIntersection, rotation: Math.PI }, // 0111
      { object: roadCrossroad, rotation: 0 }, // 1111
    ];

    // spawn road tiles
    this.position.set(-(numCols - 1) / 2, 0, -(numRows - 1) / 2);
    this.add(plane);
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        switch (this.getTile(row, col)) {
          case Tile.Street: {
            const index =
              (this.getTile(row - 1, col) === Tile.Street ? 1 : 0) |
              (this.getTile(row, col + 1) === Tile.Street ? 2 : 0) |
              (this.getTile(row + 1, col) === Tile.Street ? 4 : 0) |
              (this.getTile(row, col - 1) === Tile.Street ? 8 : 0);
            let road = roads[index].object!.clone();
            road.rotation.y = roads[index].rotation!;
            road.position.set(col, 0, row);
            this.add(road);
            break;
          }
          case Tile.House: {
            if (debug) break;
            const options = [];
            if (this.getTile(row - 1, col) === Tile.Street) options.push(Dir.N);
            if (this.getTile(row, col + 1) === Tile.Street) options.push(Dir.E);
            if (this.getTile(row + 1, col) === Tile.Street) options.push(Dir.S);
            if (this.getTile(row, col - 1) === Tile.Street) options.push(Dir.W);
            if (options.length === 0) break;
            const dir = options[randomInt(options.length)];
            const building = buildings[randomInt(buildings.length)].clone();
            building.position.set(col, 0, row);
            building.rotation.y = (2 - dir) * 0.5 * Math.PI;
            this.add(building);
            break;
          }
        }
      }
    }

    for (let i = 0; i < numCars; i++) {
      this.spawnRandomCar();
    }
    if (attachCameraToCar) {
      const car = this.cars[0];
      car.object.add(this.camera);
      this.camera.rotation.x = 0;
      this.camera.position.y = 1;
      this.camera.position.z = -1;
    }
    if (debug) {
      this.setupScenario(0);
    }
  }

  spawnRandomCar() {
    const object = this.carModels[randomInt(this.carModels.length)].clone();
    const pos = new Pos();
    do {
      pos.row = randomInt(numRows);
      pos.col = randomInt(numCols);
    } while (this.getTile(pos.row, pos.col) !== Tile.Street);
    const dirs = [];
    if (this.getTile(pos.row - 1, pos.col) === Tile.Street) dirs.push(Dir.N);
    if (this.getTile(pos.row, pos.col + 1) === Tile.Street) dirs.push(Dir.E);
    if (this.getTile(pos.row + 1, pos.col) === Tile.Street) dirs.push(Dir.S);
    if (this.getTile(pos.row, pos.col - 1) === Tile.Street) dirs.push(Dir.W);
    const car = new Car(object, pos);
    car.dir = car.nextDir = dirs[randomInt(dirs.length)];
    this.add(car.object);
    this.cars.push(car);

    if (debug) {
      car.tileBox = new THREE.Box3();
      car.tileBox.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
      this.add(new THREE.Box3Helper(car.tileBox, new THREE.Color(0xff0000)));
    }
  }

  setupScenario(id: number) {
    const speed = 1.0 / 200.0;
    if (id === 0) {
      this.cars[0].speed = speed;
      this.cars[1].speed = speed;
      this.cars[0].pos.set(4, 3);
      this.cars[0].dir = this.cars[0].nextDir = Dir.E;
      this.cars[1].pos.set(4, 5);
      this.cars[1].dir = this.cars[1].nextDir = Dir.W;
    }
  }

  update() {
    for (let car of this.cars) {
      this.updateCar(car);
    }
  }

  updateCar(car: Car) {
    let turn = car.getTurn();
    let turnDistance = getTurnDistance(turn);
    car.distance += car.speed;

    if (car.distance > turnDistance) {
      // move to next tile along nextDir
      car.pos.step(car.nextDir);
      car.dir = car.nextDir;

      // choose next direction
      const isFree = (pos: Pos) => this.getTile(pos.row, pos.col) === Tile.Street;
      let options = [Dir.N, Dir.E, Dir.S, Dir.W].filter(
        (dir) => car.dir !== flipDir(dir) && isFree(car.pos.clone().step(dir))
      );
      if (options.length === 0) {
        car.distance = turnDistance;
        return;
      }
      car.distance -= turnDistance;
      car.nextDir = options[randomInt(options.length)];
    }

    const anim = carTurnAnimation(car);
    car.object.position.set(car.pos.col + anim.x, 0.01, car.pos.row + anim.y);
    car.object.rotation.y = anim.angle;
    if (debug) {
      car.tileBox.setFromCenterAndSize(new THREE.Vector3(car.pos.col, 0, car.pos.row), new THREE.Vector3(1, 1, 1));
    }
  }
}

function carTurnAnimation(car: Car): { x: number; y: number; angle: number } {
  const turn = car.getTurn();
  const turnDistance = getTurnDistance(turn);
  const alpha = car.distance / turnDistance;
  let x = 0;
  let y = 0;
  if (turn === 0) {
    x = 0.2;
    y = 0.5 - alpha;
  } else if (turn === -1) {
    x = -0.5 + 0.7 * Math.cos(alpha * 0.5 * Math.PI);
    y = 0.5 - 0.7 * Math.sin(alpha * 0.5 * Math.PI);
  } else if (turn === 1) {
    x = 0.5 - 0.3 * Math.cos(alpha * 0.5 * Math.PI);
    y = 0.5 - 0.3 * Math.sin(alpha * 0.5 * Math.PI);
  }
  const angle = 0.5 * Math.PI * car.dir;
  return { ...rotate2D(x, y, angle), angle: -angle - alpha * turn * 0.5 * Math.PI };
}

function rotate2D(x: number, y: number, angle: number): { x: number; y: number } {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
