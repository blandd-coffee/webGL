interface tile {
  x: number;
  y: number;
  z: number;
}

interface chunk {
  x: number;
  z: number;
  tiles: tile[];
}

export type { tile, chunk };
