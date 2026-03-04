import type { locationData } from "../interfaces/location";
import { gl } from "../setup/setup";

class VAO {
  ID: WebGLVertexArrayObject;
  VBO: WebGLBuffer;
  EBO: WebGLBuffer;

  constructor(
    vertices: Float32Array,
    indices: Uint32Array,
    locations: locationData[],
  ) {
    this.ID = gl.createVertexArray();
    this.VBO = gl.createBuffer();
    this.EBO = gl.createBuffer();

    gl.bindVertexArray(VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.setLocationData(locations);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  private setLocationData(locations: locationData[]) {
    locations.forEach((location) => {
      const { position, size, stride, offset } = location;
      gl.vertexAttribPointer(position, size, gl.FLOAT, false, stride, offset);
      gl.enableVertexAttribArray(position);
    });
  }

  bind() {
    gl.bindVertexArray(this.ID);
  }
}

export { VAO };
