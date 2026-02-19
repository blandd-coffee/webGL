import { mat4, vec3 } from "gl-matrix";
import { Mesh } from "../Mesh/Mesh.ts";
import { Shader } from "../Mesh/Shader.ts";
import { camera, gl } from "../setup.ts";
import { Shape } from "./shape.ts";

export class Cube extends Shape {
  public cubeInstances: instance[] = [];

  private constructor(name: string, model: mat4, mesh: Mesh) {
    super(name, model, mesh);
  }

  static async create(model: mat4): Promise<Cube> {
    //prettier-ignore
    const vertices = new Float32Array([
      // x, y, z,    r, g, b
      -0.5, -0.5, 0.5, 1, 0, 0,
       0.5, -0.5, 0.5, 0, 1, 0,
       0.5, -0.5,-0.5, 0, 0, 1,
      -0.5, -0.5,-0.5, 1, 1, 0,

      -0.5,  0.5, 0.5, 1, 0, 0,
       0.5,  0.5, 0.5, 0, 1, 0,
       0.5,  0.5,-0.5, 0, 0, 1,
      -0.5,  0.5,-0.5, 1, 1, 0,
    ]);
    //prettier-ignore
    const indices = new Uint32Array([
      0, 1, 5, 5, 4, 0,
      1, 2, 6, 6, 5, 1,
      2, 3, 7, 7, 6, 2,
      3, 0, 4, 4, 7, 3,
      4, 5, 6, 6, 7, 4,
      0, 3, 2, 2, 1, 0,
    ]);

    const mesh = await Shape.createMesh("cube", vertices, indices);
    const cube = new Cube("cube", model, mesh);
    cube.cubeInstances.push({ model: model, distance: 0 });

    return cube;
  }

  setDistance(): void {
    const camPos = camera.postition;
    this.cubeInstances.forEach((instance, index) => {
      const cubePos = vec3.fromValues(
        instance.model[12],
        instance.model[13],
        instance.model[14],
      );

      instance.distance = vec3.distance(cubePos, camPos);
    });
    return;
  }

  draw(view: mat4, proj: mat4): void {
    this.cubeInstances
      .filter((tile) => tile.distance < 10)
      .forEach((instance) => {
        super.draw(instance.model, view, proj);
      });
  }
}

export interface instance {
  model: mat4;
  distance: number;
}
