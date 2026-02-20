import { Camera } from "./camera/camera.ts";

const glSetup = (canvas: HTMLCanvasElement | null) => {
  if (canvas === null) throw new Error("Canvas is null!");
  const gl: WebGL2RenderingContext | null = canvas.getContext("webgl2");
  if (!gl) throw new Error("Webgl2 not supported");
  gl.viewport(0, 0, canvas.width, canvas.height);
  return gl;
};

const canvasSetup: () => HTMLCanvasElement = () => {
  const canvas: HTMLCanvasElement | null = document.querySelector("#render");
  if (canvas == null) throw new Error("Canvas is empty!");
  return canvas;
};
//Canvas Setup
const canvas: HTMLCanvasElement = canvasSetup();
canvas.width = canvas.clientWidth * window.devicePixelRatio;
canvas.height = canvas.clientHeight * window.devicePixelRatio;

//wenGL2 setup
const gl: WebGL2RenderingContext = glSetup(canvas);
gl.viewport(0, 0, canvas.width, canvas.height);

// Camera Setup
const camera = new Camera("Main", [0, 0, -6], 8, 0.2);

export { canvas, gl, camera };
