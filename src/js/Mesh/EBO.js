import { gl } from "../setup.js";

export class EBO {
  id;
  indices;
  constructor(indices) {
    this.id = gl.createBuffer();
    this.indices = indices;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }
  Bind() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
  }

  unbind() {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  delete() {
    gl.deleteBuffer(this.id);
  }
}
