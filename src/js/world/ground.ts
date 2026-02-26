//Create 3d Matrices

import { vec3, mat4, vec2 } from "gl-matrix";
import { Cube } from "../Shapes/square.ts";
import { camera, gl } from "../setup/setup.ts";
import { Mesh } from "../Mesh/Mesh.ts";
import { Shader } from "../Mesh/Shader.ts";
import { Chunk } from "./chunk.ts";
//X world axis

export class World {
  public static size: number = 50;
  public static spacing: number = 1.0;
  public static half = 0.8;

  public static totalChunks: number = 6;
  public static tilesPerChunk: number = 10;
  public static chunkSize: number;
  public static createdChunks: Chunk[] = [];

  public static async initWorld() {
    const { totalChunks, chunkSize, size } = this;
    World.chunkSize = this.spacing * this.size;
    const halfChunk = totalChunks / 2;
    const halfTileChunks = size / 2;

    for (let i = 0 - halfChunk; i < halfChunk; i++) {
      let chunk: vec2 = [];
      for (let j = 0 - halfChunk; j < halfChunk; j++) {
        chunk = [i, j];
        const tiles: tile[] = [];

        //x chunk axis
        this.initChunk(tiles, chunk);
        this.createdChunks.push(await Chunk.create(chunk[0], chunk[1], tiles));
      }
    }
  }

  private static async initChunk(tiles: tile[], chunk: vec2): Promise<void> {
    const { chunkSize, size } = this;
    World.chunkSize = this.spacing * this.size;
    const halfTileChunks = size / 2;

    for (let x = -halfTileChunks; x < halfTileChunks; x++) {
      for (let z = -halfTileChunks; z < halfTileChunks; z++) {
        tiles.push({
          x: x + chunk[0] * chunkSize,
          y: 0,
          z: z + chunk[1] * chunkSize,
          chunk: chunk,
        });
      }
    }
  }

  public static drawChunks(
    chunks: Mesh[],
    view: mat4,
    projection: mat4,
    model: mat4,
  ): void {
    chunks.forEach((chunk) => {
      const ID = chunk.shaderProgram.ID;
      chunk.shaderProgram.useProgram();
      gl.uniformMatrix4fv(gl.getUniformLocation(ID, "view"), false, view);
      gl.uniformMatrix4fv(gl.getUniformLocation(ID, "proj"), false, projection);
      gl.uniformMatrix4fv(gl.getUniformLocation(ID, "model"), false, model);
      chunk.Draw();
    });
  }

  public static checkNearbyChunksMesh(
    chunks: Chunk[],
    radius: number = 2,
  ): Mesh[] {
    const cam = camera.postition;
    const r2 = radius * radius;

    const nearbyChunks = chunks.filter((c) => {
      const dx = c.x - (cam[0] / size) * spacing;
      const dz = c.z - (cam[2] / size) * spacing;
      return dx * dx + dz * dz <= r2;
    });
    return nearbyChunks.map((chunk) => chunk.mesh);
  }

  public static checkNearbyTiles(tiles: tile[], radius: number = 2): tile[] {
    const cam = camera.postition;
    const r2 = radius * radius;

    return tiles.filter((t) => {
      const dx = t.x - cam[0];
      const dy = t.y - cam[1];
      const dz = t.z - cam[2];
      return dx * dx + dy * dy + dz * dz <= r2;
    });
  }
  public static inside(tile: tile, position: vec3): boolean {
    const cx = tile.x,
      cy = tile.y,
      cz = tile.z;

    const x: boolean = position[0] >= cx - half && position[0] <= cx + half;
    const y: boolean = position[1] >= cy - half && position[1] <= cy + half;
    const z: boolean = position[2] >= cz - half && position[2] <= cz + half;
    if (x && y && z) return false;
    return true;
  }

  public static obstruct(vector: vec3, index: number): boolean {
    vector[index] = 0;
    return false;
  }

  public static check(
    tile: tile,
    pass: boolean,
    move: vec3,
    predicted: vec3,
    index: number,
  ): boolean {
    pass = inside(tile, predicted);
    if (!pass) {
      obstruct(move, index);
      return false;
    }
    return true;
  }

  public static checkCollision(move: vec3, dt: number): verticalMove {
    const cloned: vec3 = [];
    vec3.copy(cloned, move);
    //Booleans that allow camera movement in their respective directions
    let passX: boolean = true;
    let passY: boolean = true;
    let passZ: boolean = true;

    //Predict camera movement: x, y, z
    const tryX = camera.predictPosition([move[0], 0, 0], dt);
    const tryY = camera.predictPosition([0, move[1], 0], dt);
    const tryZ = camera.predictPosition([0, 0, move[2]], dt);

    //Optimize for only nearby grounds
    const nearbyTile = checkNearbyTiles(checkNearbyChunks(createdChunks));

    //Loop through each instance of a nearby ground
    nearbyTile.forEach((tile) => {
      passX = passX ? check(tile, passX, move, tryX, 0) : false;
      passY = passY ? check(tile, passY, move, tryY, 1) : false;
      passZ = passZ ? check(tile, passZ, move, tryZ, 2) : false;
    });

    const hitCeiling: boolean = !passY && cloned[1] > 0;
    const hitGround: boolean = !passY && cloned[1] < 0;
    console.log(hitGround);
    //Update cameras position
    return { move, hitGround, hitCeiling };
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
