import { gl } from "../setup/setup.ts";
/**
 * The Elemenal Buffer Object class
 *  The EBO tells the GPU what order it should draw a vertex point in based off of indices
 */
export class EBO {
  id: WebGLBuffer;
  indices: Uint32Array;
  /**
   *
   * @param indices The indices array that gets binded to the EBO
   */
  constructor(indices: Uint32Array) {
    this.id = gl.createBuffer();
    this.indices = indices;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  /**
   * Binds the current EBO
   */
  bind(): void {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
  }

  /**
   * Unbinds the current EBO
   */
  unbind(): void {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * Deletes the current EBO
   */
  delete(): void {
    gl.deleteBuffer(this.id);
  }
}
