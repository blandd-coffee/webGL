import { gl } from "../setup/setup.ts";
import { EBO } from "./EBO.js";
import { bufferAttributes, VBO } from "./VBO.ts";

/**
 * A class which contains the data relevent to the Vertex Array Object
 */
export class VAO {
  ID: WebGLVertexArrayObject;
  VBO: VBO;
  EBO: EBO | null = null;

  /**
   * Generates a VAO object
   * @param vertices The vertices for the VBO
   * @param indices The vertices for the EBO
   */
  constructor(vertices: Float32Array, indices: Uint32Array | null) {
    this.ID = gl.createVertexArray();
    this.bind();
    if (indices) this.EBO = new EBO(indices);
    this.VBO = new VBO(vertices);
  }

  /**
   * Binds the current VAO instance
   */
  bind() {
    gl.bindVertexArray(this.ID);
  }

  /**
   * Unbinds the current VAO instance
   */
  unbind() {
    gl.bindVertexArray(null);
  }

  /**
   * Sets the location attributes for the VBO
   * @param data The attribute data
   */
  setLocationAttributes(data: bufferAttributes) {
    this.bind();
    this.VBO.setAttributes(data);
    this.unbind();
  }

  /**
   * Deletes the current instace of the VAO and VBO
   */
  delete() {
    this.VBO.delete();
    gl.deleteVertexArray(this.ID);
  }
}
