const glSetup = (canvas) => {
  const gl = canvas.getContext("webgl2");
  gl.viewport(0, 0, canvas.width, canvas.height);
  if (!gl) throw new Error("Error");
  return gl;
};

/**@type {WebGL2RenderingContext} */
export const gl = glSetup(document.querySelector("#render"));
