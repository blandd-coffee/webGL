import { Mesh } from "../Mesh/Mesh.js";
import { Shader } from "../Mesh/Shader.js";
import { gl } from "../setup.js";

// Each vertex is: X, Y, Z,  R, G, B
//prettier-ignore
const vertices = new Float32Array([
  // Base Corners
  -0.5, -0.5,  0.5,    1.0, 0.0, 0.0, // Front-Left  (Index 1)
   0.5, -0.5,  0.5,    0.0, 1.0, 0.0, // Front-Right (Index 2)
   0.5, -0.5, -0.5,    0.0, 0.0, 1.0, // Back-Right  (Index 3)
  -0.5, -0.5, -0.5,    1.0, 1.0, 0.0, // Back-Left   (Index 4)

  //Roof Corners
  -0.5, 0.5,  0.5,    1.0, 0.0, 0.0, // Front-Left  (Index 1)
   0.5, 0.5,  0.5,    0.0, 1.0, 0.0, // Front-Right (Index 2)
   0.5, 0.5, -0.5,    0.0, 0.0, 1.0, // Back-Right  (Index 3)
  -0.5, 0.5, -0.5,    1.0, 1.0, 0.0, // Back-Left   (Index 4)
]);

// Indices to form 6 triangles (4 sides + 2 for the base)
//prettier-ignore
const indices = new Uint32Array([
  0, 1, 5,   5, 4, 0, // Front Face
  1, 2, 6,   6, 5, 1, // Right Face
  2, 3, 7,   7, 6, 2, // Back Face
  3, 0, 4,   4, 7, 3, // Left Face

  // --- Top & Bottom ---
  4, 5, 6,   6, 7, 4, // Top (Roof)
  0, 3, 2,   2, 1, 0  // Bottom (Base)
]);

const vertexSrc = await Shader.getShaderSource("vertex.vert");
const fragmentSrc = await Shader.getShaderSource("fragment.frag");

const Cube = new Mesh(
  "Square",
  gl.TRIANGLES,
  vertices,
  indices,
  vertexSrc,
  fragmentSrc,
);

Cube.SetLocation(0, 3, 24, 0);
Cube.SetLocation(1, 3, 24, 12);

export default Cube;
