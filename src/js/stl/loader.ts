export interface STLGeometry {
  positions: Float32Array;
  indices: Uint32Array;
}

export async function parseSTLFile(file: File): Promise<STLGeometry> {
  const buffer = await file.arrayBuffer();
  return parseSTLArrayBuffer(buffer);
}

export function parseSTLArrayBuffer(buffer: ArrayBuffer): STLGeometry {
  if (isBinarySTL(buffer)) {
    return parseBinarySTL(buffer);
  }

  return parseAsciiSTL(new TextDecoder().decode(buffer));
}

function isBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;

  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedLength = 84 + triangleCount * 50;

  return expectedLength === buffer.byteLength;
}

function parseBinarySTL(buffer: ArrayBuffer): STLGeometry {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const positions = new Float32Array(triangleCount * 9);
  const indices = new Uint32Array(triangleCount * 3);

  let writePos = 0;
  let writeIndex = 0;
  let offset = 84;

  for (let triangle = 0; triangle < triangleCount; triangle++) {
    offset += 12; // normal

    for (let vertex = 0; vertex < 3; vertex++) {
      positions[writePos++] = view.getFloat32(offset, true);
      positions[writePos++] = view.getFloat32(offset + 4, true);
      positions[writePos++] = view.getFloat32(offset + 8, true);
      offset += 12;
      indices[writeIndex] = writeIndex;
      writeIndex++;
    }

    offset += 2; // attribute byte count
  }

  return { positions, indices };
}

function parseAsciiSTL(text: string): STLGeometry {
  const vertexRegex =
    /vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;

  const values: number[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = vertexRegex.exec(text)) !== null) {
    values.push(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  if (values.length === 0 || values.length % 9 !== 0) {
    throw new Error("Invalid ASCII STL: no triangle vertices found.");
  }

  const vertexCount = values.length / 3;
  const positions = new Float32Array(values);
  const indices = new Uint32Array(vertexCount);

  for (let i = 0; i < vertexCount; i++) indices[i] = i;

  return { positions, indices };
}
