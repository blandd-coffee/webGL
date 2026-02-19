import { Mesh } from "../Mesh/Mesh.js";
import { Shader } from "../Mesh/Shader.ts";
import { gl } from "../setup.js";

// Each vertex is: X, Y, Z,  R, G, B
//prettier-ignore
const vertices = new Float32Array([
  // Apex (Top Point) - Index 0
  0.0,  0.6,  0.0,    1.0, 1.0, 1.0, 

  // Base Corners
  -0.5, -0.4,  0.5,    1.0, 0.0, 0.0, // Front-Left  (Index 1)
   0.5, -0.4,  0.5,    0.0, 1.0, 0.0, // Front-Right (Index 2)
   0.5, -0.4, -0.5,    0.0, 0.0, 1.0, // Back-Right  (Index 3)
  -0.5, -0.4, -0.5,    1.0, 1.0, 0.0, // Back-Left   (Index 4)
]);

// Indices to form 6 triangles (4 sides + 2 for the base)
//prettier-ignore
const indices = new Uint32Array([
  // 4 Side Faces
  0, 1, 2, // Front
  0, 2, 3, // Right
  0, 3, 4, // Back
  0, 4, 1, // Left

  // Square Base (Two triangles)
  1, 3, 2, // Base Triangle 1
  1, 4, 3, // Base Triangle 2
]);

const vertexSrc = await Shader.getShaderSource("vertex.vert");
const fragmentSrc = await Shader.getShaderSource("fragment.frag");

const Triangle = new Mesh(
  "Triangle",
  gl.TRIANGLES,
  vertices,
  indices,
  vertexSrc,
  fragmentSrc,
);

Triangle.SetLocation(0, 3, 24, 0);
Triangle.SetLocation(1, 3, 24, 12);

export default Triangle;
