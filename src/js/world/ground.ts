//Create 3d Matrices

import { vec3, mat4 } from "gl-matrix";
import { Cube } from "../Shapes/square.ts";
import { camera } from "../setup.ts";

//Populate the ground grid
const size = 5; //The amount of grounds
const spacing = 1.0; //This is the size
const y = 0;
const half = 0.8;
const tiles: tile[] = [];

for (let i = 1; i < 5; i++) {
  for (let x = -size / 2; x < size / 2; x++) {
    for (let z = (-size * i) / 2; z < size / 2; z++) {
      tiles.push({ x: x * spacing * i, y: y, z: z * spacing * i });
    }
  }
  for (let x = -size / 2; x < size / 2; x++) {
    for (let z = -size / 2; z < size / 2; z++) {
      tiles.push({ x: x * spacing, y: y + 3, z: z * spacing });
    }
  }
}

function init(): vertex {
  return buildGround(tiles);
}

function checkNearby(radius: number = 2): tile[] {
  const cam = camera.postition;
  const r2 = radius * radius;

  return tiles.filter((t) => {
    const dx = t.x - cam[0];
    const dy = t.y - cam[1];
    const dz = t.z - cam[2];
    return dx * dx + dy * dy + dz * dz <= r2;
  });
}

function inside(tile: tile, position: vec3): boolean {
  const cx = tile.x,
    cy = tile.y,
    cz = tile.z;

  const x: boolean = position[0] >= cx - half && position[0] <= cx + half;
  const y: boolean = position[1] >= cy - half && position[1] <= cy + half;
  const z: boolean = position[2] >= cz - half && position[2] <= cz + half;
  if (x && y && z) return false;
  return true;
}

function obstruct(vector: vec3, index: number): boolean {
  vector[index] = 0;
  return false;
}

function check(
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

function checkCollision(move: vec3, dt: number): verticalMove {
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
  const nearbyTile = checkNearby();

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

function buildGround(tiles: tile[]): vertex {
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

interface tile {
  x: number;
  y: number;
  z: number;
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

export { init, checkCollision };
