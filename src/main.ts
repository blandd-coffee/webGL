import { mat4, vec3 } from "gl-matrix";
import { camera, canvas, gl } from "./js/setup/setup.ts";
import { Cube, instance } from "./js/Shapes/square.ts";
import {
  aKey,
  shiftKey,
  dKey,
  sKey,
  spaceKey,
  wKey,
} from "./js/setup/interactions.ts";
import { Camera } from "./js/camera/camera.ts";
import {
  checkCollision,
  checkNearbyChunksMesh,
  drawChunks,
  World,
} from "./js/world/ground.ts";
import { Mesh } from "./js/Mesh/Mesh.ts";
import getShaderSource from "./js/utilities/filefetcher.ts";
import { Chunk } from "./js/world/chunk.ts";

//Config
gl.clearColor(0, 0.5, 0.5, 1);
gl.enable(gl.DEPTH_TEST);
await World.initWorld();
//Create 3d Matrices
const view = mat4.create(); //what is visible
const projection = mat4.create(); // Modifies what is visible
const model = mat4.create(); // Modifies what is visible
let lastTime = 0;

const gravity = -1;
function camMovement(dt: number): vec3 {
  const move: vec3 = vec3.create();
  // generate a movement vector based on movement
  if (wKey) move[2] -= 1;
  if (aKey) move[0] -= 1;
  if (sKey) move[2] += 1;
  if (dKey) move[0] += 1;

  if (spaceKey && camera.grounded) {
    camera.grounded = false;
    camera.velocity[1] = 1;
    move[1] = camera.velocity[1];
  } else if (!camera.grounded) {
    //
    camera.velocity[1] += gravity * dt;
    move[1] = camera.velocity[1];
  }

  return move;
}

function update(dt: number) {
  const pressed: vec3 = camMovement(dt);

  //Camera Movement
  mat4.perspective(
    projection,
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    100.0,
  );

  const collisions = checkCollision(pressed, dt);
  if (collisions.hitGround) {
    camera.velocity[1] = 0;
    collisions.move[1] = 0;
    camera.grounded = true;
  } else {
    camera.grounded = false;
  }

  if (collisions.hitCeiling) {
    camera.velocity[1] = 0;
  }

  camera.updatePosition(collisions.move, dt);
  camera.updateMatrix();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Invert so that items display an equal distance from the cameras position, not directly on top
  mat4.invert(view, Camera.current.cameraMatrix);

  //Render in each tile

  drawChunks(checkNearbyChunksMesh(Chunk.chunks), view, projection, model);
}

function loop(nowMS: number) {
  //get the time between the last movement
  const now = nowMS * 0.001;
  const dt = lastTime === 0 ? 0 : now - lastTime;
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
