import { gl } from "../setup/setup.ts";
import { Shader } from "./Shader.ts";
import { VAO } from "./VAO.ts";

/**
 * A class that defines the general shape of a model
 */
export class Mesh {
  static meshes: Map<string, Mesh> = new Map();
  name: string;
  shape: GLint;
  vertices: Float32Array;
  indices: Uint32Array;
  shaderProgram: Shader; // Instance of the Shader Class
  VAO: VAO; //instance of theVertex Array Object

  /**
   * Creates a new mesh object
   * @param name The name of the mesh
   * @param shape The shape of the mesh, defaulted to gl.TRIANGLES
   * @param vertices The vertices that hold the general shape of the object
   * @param indices The indices that hold the order vertices should be rendered
   * @param vertexSrc The vertex shader file data
   * @param fragmentSrc The fragment shader file data
   */
  constructor(
    name: string,
    shape: GLuint,
    vertices: Float32Array,
    indices: Uint32Array,
    vertexSrc: string,
    fragmentSrc: string,
  ) {
    this.shape = shape;
    this.name = name;
    this.vertices = vertices;
    this.indices = indices;
    this.shaderProgram = new Shader(vertexSrc, fragmentSrc);
    this.VAO = new VAO(vertices, indices);

    Mesh.meshes.set(name, this);
  }

  /**
   * Sets the attribute locations for the VBO
   * @param location The location attrib for the VBO
   * @param points The point attrib
   * @param stride The size in bytes between each point
   * @param offset The point in bytes which controls what vertex attribute accessed
   */
  SetLocation(
    location: number,
    points: number,
    stride: number,
    offset: number,
  ): void {
    this.VAO.setLocationAttributes({ location, points, stride, offset });
  }

  /**
   * Draws a displays the current instance of the mesh
   */
  Draw(): void {
    const { shaderProgram, VAO } = this;

    shaderProgram.useProgram();
    VAO.bind();
    if (this.indices) {
      gl.drawElements(this.shape, this.indices.length, gl.UNSIGNED_INT, 0);
    } else throw new Error("No indices");
  }

  /**
   * Deletes the current instace of the mesh
   */
  delete(): void {
    this.shaderProgram.delete();
    this.VAO.delete();
  }
}
