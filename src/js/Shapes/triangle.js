import { Mesh } from "../Mesh/Mesh.js";
import { Shader } from "../Mesh/Shader.js";
import { gl } from "../setup.js";

//prettier-ignore
const vertices = new Float32Array([
  //X     Y    Z
   0.0,  0.5, 0.0, 
  -0.5, -0.5, 0.0, 
   0.5, -0.5, 0.0,
]);

const vertexSrc = await Shader.getShaderSource("vertex.vert");
const fragmentSrc = await Shader.getShaderSource("fragment.frag");

const Triangle = new Mesh(
  "Triangle",
  gl.TRIANGLES,
  vertices,
  vertexSrc,
  fragmentSrc,
);
Triangle.SetLocation(0, 3, 12, 0);

export default Triangle;
