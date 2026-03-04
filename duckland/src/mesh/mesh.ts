import type { locationData } from "../interfaces/location";
import { VAO } from "./objects";

class Mesh {
  name: string;
  VAO: VAO;

  constructor(
    name: string,
    vertices: Float32Array,
    indices: Uint32Array,
    locations: locationData[],
  ) {
    this.name = name;
    this.VAO = new VAO(vertices, indices, locations);
  }

  public static async create(name: string) {
    const vertices = new Float32Array([
      0.5,
      0.5,
      0.0, // Top right
      0.5,
      -0.5,
      0.0, // Bottom right
      -0.5,
      0.5,
      0.0, // Top Left
      -0.5,
      -0.5,
      0.0, // Bottom left
    ]);
    const indices = new Uint32Array([0, 1, 3, 3, 2, 0]);
    const location1: locationData = {
      position: 0,
      size: 3,
      stride: 3,
      offset: 0,
    };
    const location2: locationData = {
      position: 1,
      size: 3,
      stride: 3,
      offset: 3,
    };
    return new Mesh(name, vertices, indices, [location1, location2]);
  }
}
