import { gl } from "../setup/setup.ts";

/**
 * A class which contains the Vertex Buffer Array and relevant dataa
 */
class VBO {
  ID: WebGLBuffer;
  vertices: Float32Array;

  /**
   * Generates a VBO based off of the given vertices
   * @param vertices The vertices to map
   */
  constructor(vertices: Float32Array) {
    this.ID = gl.createBuffer();
    this.vertices = vertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.ID);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }

  /**
   * Sets the attribute data for the current VBo instance
   * @param attributes The attribute data to attribute to the current VBO instance
   */
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

  /**
   * Binds the current VAO instance
   */
  bind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ID);
  }

  /**
   * Unbinds the current VBO instance
   */
  unbind() {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  /**
   * Deletes the current VBO instance
   */
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
