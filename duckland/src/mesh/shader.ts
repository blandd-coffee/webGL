import { gl } from "../setup/setup";

class Shader {
  program: WebGLProgram;

  constructor(program: WebGLProgram) {
    this.program = program;
  }

  public static async create(pathToVertex: string, pathToFragment: string) {
    const getFile = async (path: string) => {
      try {
        const data = await fetch(path);
        if (!data.ok) throw new Error("File error!");
        const file = await data.text();
        return file;
      } catch (error) {
        console.log(error);
        throw error;
      }
    };

    const vertSrc = await getFile(pathToVertex);
    const fragSrc = await getFile(pathToFragment);

    const vertShader = Shader.compile(gl.VERTEX_SHADER, vertSrc);
    const fragShader = Shader.compile(gl.FRAGMENT_SHADER, fragSrc);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);

    return new Shader(program);
  }
  
  private static compile(type: GLenum, src: string): WebGLShader {
    try {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader does not exist");
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  public use() {
    gl.useProgram(this.program);
  }
}
