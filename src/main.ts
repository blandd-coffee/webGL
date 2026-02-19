import { mat4, vec3 } from "gl-matrix";
import { camera, canvas, gl } from "./js/setup.ts";
import { Cube, instance } from "./js/Shapes/square.ts";
import {
  aKey,
  shiftKey,
  dKey,
  sKey,
  spaceKey,
  wKey,
} from "./js/interactions.ts";
import { Camera } from "./js/camera/camera.ts";
import { checkCollision, ground, init } from "./js/world/ground.ts";
import { Mesh } from "./js/Mesh/Mesh.ts";
import { Shader } from "./js/Mesh/Shader.ts";
//Config
gl.clearColor(0, 0.5, 0.5, 1);
gl.enable(gl.DEPTH_TEST);

//Create 3d Matrices
const view = mat4.create(); //what is visible
const projection = mat4.create(); // Modifies what is visible
const model = mat4.create(); // Modifies what is visible
let lastTime = 0;
const groundShape = init();
const vertexSrc = await Shader.getShaderSource("vertex.vert");
const fragmentSrc = await Shader.getShaderSource("fragment.frag");

const testGround = new Mesh(
  "ground",
  gl.TRIANGLES,
  groundShape.vertices,
  groundShape.indices,
  vertexSrc,
  fragmentSrc,
);
testGround.SetLocation(0, 3, 24, 0);
testGround.SetLocation(1, 3, 24, 12);

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
  testGround.shaderProgram.useProgram();
  const ID = testGround.shaderProgram.ID;
  gl.uniformMatrix4fv(gl.getUniformLocation(ID, "view"), false, view);
  gl.uniformMatrix4fv(gl.getUniformLocation(ID, "model"), false, model);
  gl.uniformMatrix4fv(gl.getUniformLocation(ID, "proj"), false, projection);
  testGround.Draw();
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
