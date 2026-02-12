import { gl } from "../setup.js";
import { EBO } from "./EBO.js";
import { VBO } from "./VBO.js";

export class VAO {
  ID;
  VBO;
  EBO;

  constructor(vertices, indices = null) {
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

  setLocation(location, points, stride, offset) {
    this.bind();
    this.VBO.SetLocation(location, points, stride, offset);
    this.unbind();
  }

  delete() {
    this.VBO.delete();
    gl.deleteVertexArray(this.ID);
  }
}
