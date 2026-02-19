import { gl } from "../setup.ts";

export class Shader {
  ID: WebGLProgram;
  constructor(vertexSrc: string, fragmentSrc: string) {
    this.ID = gl.createProgram();
    const vertexShader: WebGLShader = this.compile(gl.VERTEX_SHADER, vertexSrc);
    const fragmentShader = this.compile(gl.FRAGMENT_SHADER, fragmentSrc);
    this.cleanup(vertexShader, fragmentShader);
  }

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

  private cleanup(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): void {
    gl.attachShader(this.ID, vertexShader);
    gl.attachShader(this.ID, fragmentShader);

    gl.linkProgram(this.ID);

    gl.detachShader(this.ID, vertexShader);
    gl.detachShader(this.ID, fragmentShader);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  static async getShaderSource(path: string): Promise<string> {
    try {
      const response: Response = await fetch(`/assets/${path}`);
      if (!response.ok)
        throw new Error(`Error fetching shader: ${response.status}`);
      const data: string = await response.text();

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  useProgram(): void {
    gl.useProgram(this.ID);
  }

  delete(): void {
    gl.deleteProgram(this.ID);
  }
}
