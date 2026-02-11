export function vertices(vertex) {
  return vertex.flat();
}

export function vertex(x, y, z) {
  return new Float32Array([x, y, z]);
}
