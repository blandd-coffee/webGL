import { mat4 } from "gl-matrix";
import { Mesh } from "../Mesh/Mesh.ts";
import { Shader } from "../Mesh/Shader.ts";
import { gl } from "../setup.ts";
import { Shape } from "./shape.ts";

export class Plane extends Shape {
  private constructor(name: string, model: mat4, mesh: Mesh) {
    super(name, model, mesh);
  }

  static async create(model: mat4): Promise<Plane> {
    //prettier-ignore
    const vertices = new Float32Array([
      // x, y, z,    r, g, b
      -100, -2, 100, 0.5, 1, 0,
       100, -2, 100, 0.5, 1, 0,
       100, -2,-100, 0.5, 1, 1,
      -100, -2,-100, 0.5, 1, 0,
    ]);
    //prettier-ignore
    const indices = new Uint32Array([
      0, 1, 2,
      2, 3, 0
    ]);

    const mesh = await Shape.createMesh("plane", vertices, indices);
    return new Plane("plane", model, mesh);
  }

  draw(view: mat4, proj: mat4): void {
    super.draw(view, proj);
  }
}
