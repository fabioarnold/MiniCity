export class InputController {
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
