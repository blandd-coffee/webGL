import { mat4, vec3 } from "gl-matrix";
import { gl } from "./js/setup.js";
import Triangle from "./js/Shapes/triangle.js";
import Cube from "./js/Shapes/square.js";

//Config
gl.clearColor(0, 0.5, 0.5, 1);
gl.enable(gl.DEPTH_TEST);

//Create 3d Matrices
const view = mat4.create(); //The world
const projection = mat4.create(); // The Camera //TODO: Move to Camera class and use there
const model = mat4.create(); //The object

const program = Cube.shaderProgram.ID;

let lastTime = 0;
let rotationY = 0;
const ROTATION_SPEED = 10;
let height = -2;
function update(dt) {
  height += height >= 2 ? -4 : 0.02;
  mat4.translate(view, mat4.create(), [0, height, -5]);
  mat4.identity(model);
  rotationY += dt * ROTATION_SPEED;
  mat4.rotateY(model, model, rotationY);
  mat4.perspective(projection, Math.PI / 4, 800 / 600, 0.1, 100.0);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, view);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "proj"),
    false,
    projection,
  );
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, model);
  Cube.Draw(3);
}

function loop(nowMS) {
  const now = nowMS * 0.001;
  const dt = lastTime === 0 ? 0 : now - lastTime;
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
