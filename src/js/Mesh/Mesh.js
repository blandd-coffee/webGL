import { gl } from "../setup.js";
import { Shader } from "./Shader.js";
import { VAO } from "./VAO.js";

export class Mesh {
  name;
  shape;
  vertices;
  indices;
  shaderProgram; // Instance of the Shader Class
  VAO; //instance of theVertex Array Object

  //TODO: Create a variable for the vertices tat olds a vec3 for any data ex: poin, color, texcoords, light
  constructor(name, shape, vertices, indices, vertexSrc, fragmentSrc) {
    this.shape = shape;
    this.name = name;
    this.vertices = vertices;
    this.indices = indices;
    this.shaderProgram = new Shader(vertexSrc, fragmentSrc);
    this.VAO = new VAO(vertices, indices);
  }

  //TODO Automate the location process, prollythru an array or object containing said positions
  SetLocation(location, points, stride, offset) {
    this.VAO.setLocation(location, points, stride, offset);
  }

  Draw(size) {
    const { shaderProgram, VAO } = this;

    shaderProgram.useProgram();
    VAO.bind();
    if (this.indices) {
      gl.drawElements(this.shape, this.indices.length, gl.UNSIGNED_INT, 0);
    } else gl.drawArrays(this.shape, 0, size);
  }

  delete() {
    this.shaderProgram.delete();

    this.VAO.delete();
  }
}
