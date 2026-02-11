import { gl } from "../setup.js";
import { VBO } from "./VBO.js";

export class VAO {
  ID;
  vertices;
  VBO;

  constructor(vertices) {
    this.ID = gl.createVertexArray();
    this.vertices = vertices;

    this.VBO = new VBO(this.vertices);
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
