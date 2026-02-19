import { gl } from "../setup.ts";
import { Shader } from "./Shader.ts";
import { VAO } from "./VAO.ts";

export class Mesh {
  static meshes: Map<string, Mesh> = new Map();
  name: string;
  shape: GLint;
  vertices: Float32Array;
  indices: Uint32Array;
  shaderProgram: Shader; // Instance of the Shader Class
  VAO: VAO; //instance of theVertex Array Object

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

  //TODO Automate the location process, prollythru an array or object containing said positions
  SetLocation(
    location: number,
    points: number,
    stride: number,
    offset: number,
  ): void {
    this.VAO.setLocationAttributes({ location, points, stride, offset });
  }

  Draw(): void {
    const { shaderProgram, VAO } = this;

    shaderProgram.useProgram();
    VAO.bind();
    if (this.indices) {
      gl.drawElements(this.shape, this.indices.length, gl.UNSIGNED_INT, 0);
    } else throw new Error("No indices");
  }

  delete(): void {
    this.shaderProgram.delete();
    this.VAO.delete();
  }
}
