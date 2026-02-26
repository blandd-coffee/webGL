import { gl } from "../setup/setup.ts";

/**
 * A class which holds, compiles, and links a program for WebGL2
 */
export class Shader {
  ID: WebGLProgram;

  /**
   *
   * @param vertexSrc The raw vertex file source
   * @param fragmentSrc The raw fragment file source
   */
  constructor(vertexSrc: string, fragmentSrc: string) {
    this.ID = gl.createProgram();
    const vertexShader: WebGLShader = this.compile(gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = this.compile(gl.FRAGMENT_SHADER, fragmentSrc);
    this.link(vertexShader, fragmentShader);
  }

  /**
   * The helper function that compiles a given shader and returns it
   * @param type The type of shader to try and compile
   * @param shaderSrc The shader file to attempt to compile
   * @returns
   */
  private compile(type: number, shaderSrc: string): WebGLShader {
    try {
      const shader: WebGLShader | null = gl.createShader(type);
      if (shader == null) throw new Error("The shader is empty!");
      gl.shaderSource(shader, shaderSrc);
      gl.compileShader(shader);

      return shader;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Links the vertex and fragment shader to the shader program class
   * @param vertexShader The compiled vertex shader
   * @param fragmentShader The compiled fragment shader
   */
  private link(vertexShader: WebGLShader, fragmentShader: WebGLShader): void {
    gl.attachShader(this.ID, vertexShader);
    gl.attachShader(this.ID, fragmentShader);

    gl.linkProgram(this.ID);

    gl.detachShader(this.ID, vertexShader);
    gl.detachShader(this.ID, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  /**
   * links the current shader instance for use
   */
  useProgram(): void {
    gl.useProgram(this.ID);
  }

  /**
   * Deletes the current shader instance
   */
  delete(): void {
    gl.deleteProgram(this.ID);
  }
}
