import { gl } from "../setup.ts";

class VBO {
  ID: WebGLBuffer; //identifier for the buffer
  vertices: Float32Array;

  constructor(vertices: Float32Array) {
    this.ID = gl.createBuffer();
    this.vertices = vertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.ID);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  setAttributes(attributes: bufferAttributes) {
    this.bind();
    gl.vertexAttribPointer(
      attributes.location,
      attributes.points,
      gl.FLOAT,
      false,
      attributes.stride,
      attributes.offset,
    );
    gl.enableVertexAttribArray(attributes.location);
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

interface bufferAttributes {
  location: number;
  points: number;
  stride: number;
  offset: number;
}

export { VBO, bufferAttributes };
