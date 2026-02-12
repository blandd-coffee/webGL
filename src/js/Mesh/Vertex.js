export function shape(vertices) {
  return vertices.map((vertex) => vertex.flat());
}

export function vertex(x, y, z) {
  return new Float32Array([x, y, z]);
}
