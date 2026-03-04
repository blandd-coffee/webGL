/**
 *
 * @param canvas The canvas element to use for rendering webgl2
 * @returns
 */
const glSetup = async (
  canvas: HTMLCanvasElement | null,
): Promise<WebGL2RenderingContext> => {
  if (canvas === null) throw new Error("Canvas element is empty!");
  try {
    const gl: WebGL2RenderingContext | null = canvas.getContext("webgl2");
    if (!gl) throw new Error("Initialization of webgl2 failed!");
    return gl;
  } catch (error) {
    console.error("Error initializing webGL2: ", error);
    throw error;
  }
};

const getCanvas = (identifier: string): HTMLCanvasElement => {
  if (!identifier) throw new Error("No identifier!");
  try {
    const canvas: HTMLCanvasElement | null = document.querySelector(identifier);
    if (!canvas)
      throw new Error("No canvas found from identifier " + identifier);
    return canvas;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { glSetup, getCanvas };
