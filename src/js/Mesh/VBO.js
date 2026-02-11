import { gl } from "../setup.js";

export class VBO {
  ID; //identifier for the buffer
  vertices;

  constructor(vertices) {
    this.ID = gl.createBuffer();
    this.vertices = vertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.ID);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  SetLocation(location, points, stride, offset) {
    this.bind();
    gl.vertexAttribPointer(location, points, gl.FLOAT, false, stride, offset);
    gl.enableVertexAttribArray(location);
    this.unbind();
  }

  bind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ID);
  }

  unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  delete() {
    gl.deleteBuffer(this.ID);
  }
}
