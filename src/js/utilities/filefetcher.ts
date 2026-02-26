/**
 *
 * @param path The path to a shader file
 * @returns
 */
export default async function getShaderSource(path: string): Promise<string> {
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
