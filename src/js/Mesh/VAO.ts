import { gl } from "../setup.ts";
import { EBO } from "./EBO.js";
import { bufferAttributes, VBO } from "./VBO.ts";

export class VAO {
  ID: WebGLVertexArrayObject;
  VBO: VBO;
  EBO: EBO | null = null;

  constructor(vertices: Float32Array, indices: Uint32Array | null) {
    this.ID = gl.createVertexArray();
    this.bind();
    if (indices) this.EBO = new EBO(indices);
    this.VBO = new VBO(vertices);
  }

  bind() {
    gl.bindVertexArray(this.ID);
  }

  unbind() {
    gl.bindVertexArray(null);
  }

  setLocationAttributes(data: bufferAttributes) {
    this.bind();
    this.VBO.setAttributes(data);
    this.unbind();
  }

  delete() {
    this.VBO.delete();
    gl.deleteVertexArray(this.ID);
  }
}
