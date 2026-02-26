import { Mesh } from "../Mesh/Mesh";
import { vec2, vec3 } from "gl-matrix";
import { gl } from "../setup/setup";
import { camera } from "../setup/setup";
import getShaderSource from "../utilities/filefetcher";
import { World } from "./ground";

export class Chunk {
  public static chunks: Chunk[] = [];
  public mesh: Mesh;
  public x: number;
  public z: number;
  public tiles: Array<tile> = [];

  /**
   * Generates a chunk
   * @param x The location of a chunk on the x axis
   * @param z The location of a chunk on the z axis
   * @param mesh The mesh used for drawing a chunk
   */
  constructor(x: number, z: number, tiles: tile[], mesh: Mesh) {
    this.mesh = mesh;
    this.tiles = tiles;
    this.x = x;
    this.z = z;
    Chunk.chunks.push(this);
  }

  /**
   * Creates and returns a chunk object based off of the inputted data
   * @param x The location of a chunk on the x axis
   * @param z The location of a chunk on the z axis
   * @param tiles The tiles to form the new mesh
   * @returns
   */
  public static async create(
    x: number,
    z: number,
    tiles: tile[],
  ): Promise<Chunk> {
    const { vertices, indices } = Chunk.buildGround(tiles);
    const vertexSrc = await getShaderSource("vertex.vert");
    const fragmentSrc = await getShaderSource("fragment.frag");

    const chunkMesh = new Mesh(
      "ground",
      gl.TRIANGLES,
      vertices,
      indices,
      vertexSrc,
      fragmentSrc,
    );
    chunkMesh.SetLocation(0, 3, 24, 0);
    chunkMesh.SetLocation(1, 3, 24, 12);

    return new Chunk(x, z, tiles, chunkMesh);
  }

  /**
   * Checks the camera for nearbyChunks
   * @param radius the radius of collision
   * @returns
   */
  public static checkNearbyChunks(chunks: Chunk[], radius: number = 2): tile[] {
    const cam = camera.postition;
    const r2 = radius * radius;

    const nearbyChunks = chunks.filter((c) => {
      const dx = c.x - (cam[0] / World.size) * World.spacing;
      const dz = c.z - (cam[2] / World.size) * World.spacing;
      return dx * dx + dz * dz <= r2;
    });
    return nearbyChunks.map((chunk) => chunk.tiles).flat();
  }

  /**
   * Generates a new mesh based off of the amount of tiles and their locations within a chunk
   * @param tiles The tiles array to generate a new mesh
   * @returns
   */
  private static buildGround(tiles: tile[]): vertex {
    //prettier-ignore
    const baseVertices = new Float32Array([
      // x, y, z,    r, g, b
      -0.5, -0.5, 0.5, 1, 0, 0,
       0.5, -0.5, 0.5, 0, 1, 0,
       0.5, -0.5,-0.5, 0, 0, 1,
      -0.5, -0.5,-0.5, 1, 1, 0,

      -0.5,  0.5, 0.5, 1, 0, 0,
       0.5,  0.5, 0.5, 0, 1, 0,
       0.5,  0.5,-0.5, 0, 0, 1,
      -0.5,  0.5,-0.5, 1, 1, 0,
    ]);
    //prettier-ignore
    const baseIndices = new Uint32Array([
      0, 1, 5, 5, 4, 0,
      1, 2, 6, 6, 5, 1,
      2, 3, 7, 7, 6, 2,
      3, 0, 4, 4, 7, 3,
      4, 5, 6, 6, 7, 4,
      0, 3, 2, 2, 1, 0,
    ]);

    const floatsPerVertex: number = 6;
    const vertsPerCube: number = 8;
    const idxPerCube: number = 36;

    let vOut = 0;
    let iOut = 0;
    let vertexBase = 0;

    const vertices = new Float32Array(
      tiles.length * vertsPerCube * floatsPerVertex,
    );

    const indices = new Uint32Array(tiles.length * idxPerCube);

    for (const t of tiles) {
      for (let i = 0; i < baseVertices.length; i += 6) {
        vertices[vOut++] = baseVertices[i] + t.x;
        vertices[vOut++] = baseVertices[i + 1] + t.y;
        vertices[vOut++] = baseVertices[i + 2] + t.z;
        vertices[vOut++] = baseVertices[i + 3];
        vertices[vOut++] = baseVertices[i + 4];
        vertices[vOut++] = baseVertices[i + 5];
      }

      for (let i = 0; i < baseIndices.length; i++) {
        indices[iOut++] = baseIndices[i] + vertexBase;
      }
      vertexBase += vertsPerCube;
    }

    return { vertices, indices };
  }
}

interface tile {
  x: number;
  y: number;
  z: number;
  chunk: vec2;
}

interface vertex {
  vertices: Float32Array;
  indices: Uint32Array;
}

interface verticalMove {
  move: vec3;
  hitGround: boolean;
  hitCeiling: boolean;
}
