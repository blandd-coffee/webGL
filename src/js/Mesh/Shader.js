import { gl } from "../setup.js";

export class Shader {
  ID;
  constructor(vertexSrc, fragmentSrc) {
    const run = async () => {
      try {
        this.ID = gl.createProgram();
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSrc);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSrc);
        gl.compileShader(fragmentShader);

        gl.attachShader(this.ID, vertexShader);
        gl.attachShader(this.ID, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        gl.linkProgram(this.ID);
      } catch (error) {
        throw new Error(error);
      }
    };
    run();
  }

  static async getShaderSource(path) {
    try {
      const data = await fetch(`/assets/${path}`);
      const response = await data.text();
      return response;
    } catch (err) {
      throw new Error(err);
    }
  }

  useProgram() {
    gl.useProgram(this.ID);
  }

  delete() {
    gl.deleteProgram(this.ID);
  }
}
