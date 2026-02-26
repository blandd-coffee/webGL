import { mat4 } from "gl-matrix";
import { Mesh } from "../Mesh/Mesh.ts";
import { Shader } from "../Mesh/Shader.ts";
import { gl } from "../setup/setup.ts";
/**
 * An abstract class which defines the basic parameters that every object should have
 */
export abstract class Shape {
  public readonly name: string;
  public readonly mesh: Mesh;
  public readonly model: mat4;

  protected constructor(name: string, model: mat4, mesh: Mesh) {
    this.name = name;
    this.model = model;
    this.mesh = mesh;
  }

  /**
   * Creates a mesh based off of the given data
   * @param name The name of the mesh
   * @param vertices The vertices for the VBO
   * @param indices The vertices for the EBO
   * @returns
   */
  protected static async createMesh(
    name: string,
    vertices: Float32Array,
    indices: Uint32Array,
  ): Promise<Mesh> {
    const vertexSrc = await getShaderSource("vertex.vert");
    const fragmentSrc = await getShaderSource("fragment.frag");

    const mesh = new Mesh(
      name,
      gl.TRIANGLES,
      vertices,
      indices,
      vertexSrc,
      fragmentSrc,
    );

    mesh.SetLocation(0, 3, 24, 0);
    mesh.SetLocation(1, 3, 24, 12);

    return mesh;
  }

  /**
   * Draws the shape
   * @param model The model matrix which determines the local orientation of the object
   * @param view The view matrix which determines the global orientation of the object
   * @param proj The projection matrix which determins the clip space visible
   */
  protected draw(model: mat4, view: mat4, proj: mat4): void {
    const ID = this.mesh.shaderProgram.ID;
    gl.useProgram(ID);
    gl.uniformMatrix4fv(gl.getUniformLocation(ID, "view"), false, view);
    gl.uniformMatrix4fv(gl.getUniformLocation(ID, "proj"), false, proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(ID, "model"), false, model);
    this.mesh.Draw();
  }
}
