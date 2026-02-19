import { canvas, camera } from "./setup.ts";

let wKey: boolean = false;
let aKey: boolean = false;
let sKey: boolean = false;
let dKey: boolean = false;

let spaceKey: boolean = false;
let shiftKey: boolean = false;

let mouse: MouseEvent | null;
canvas?.addEventListener("click", () => {
  canvas?.requestPointerLock();
});

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  if (event.code == "KeyW") wKey = true;
  if (event.code == "KeyA") aKey = true;
  if (event.code == "KeyS") sKey = true;
  if (event.code == "KeyD") dKey = true;
  if (event.code == "Space") spaceKey = true;
  if (event.shiftKey) shiftKey = true;
});

document.addEventListener("keyup", (event) => {
  if (event.code == "KeyW") wKey = false;
  if (event.code == "KeyA") aKey = false;
  if (event.code == "KeyS") sKey = false;
  if (event.code == "KeyD") dKey = false;
  if (event.code == "Space") spaceKey = false;
  if (!event.shiftKey) shiftKey = false;
});

document.addEventListener("mousemove", (event) => {
  mouse = event;
  if (document.pointerLockElement !== canvas) return;

  let deltaX: number = -event.movementX;
  let deltaY: number = -event.movementY;

  camera.look(deltaX, deltaY);
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement !== canvas) wKey = aKey = sKey = dKey = false;
});

export { wKey, aKey, sKey, dKey, spaceKey, shiftKey };
