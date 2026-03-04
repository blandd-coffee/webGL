import { glSetup, getCanvas } from "./webgl";

const canvas: HTMLCanvasElement = getCanvas("gl");
const gl: WebGL2RenderingContext = await glSetup(canvas);

export { gl };
