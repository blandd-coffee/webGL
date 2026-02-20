import { mat4, vec3 } from "gl-matrix";
import { camera, canvas, gl } from "./js/setup.ts";
import { Mesh } from "./js/Mesh/Mesh.ts";
import { Shader } from "./js/Mesh/Shader.ts";
import { parseSTLArrayBuffer, parseSTLFile } from "./js/stl/loader.ts";

type MeshPart = {
  id: string;
  name: string;
  positions: Float32Array;
  color: [number, number, number];
  vertices: Float32Array;
  indices: Uint32Array;
  mesh: Mesh;
};

type PendingGeometry = {
  fileName: string;
  positions: Float32Array;
  indices: Uint32Array;
};

const projection = mat4.create();
const view = mat4.create();
const model = mat4.create();
mat4.identity(model);

const fileInput = document.querySelector<HTMLInputElement>("#stlFiles");
const loadDuckButton = document.querySelector<HTMLButtonElement>("#loadDuck");
const autoAlignToggle = document.querySelector<HTMLInputElement>("#autoAlignToggle");
const partSelect = document.querySelector<HTMLSelectElement>("#partSelect");
const partColorInput = document.querySelector<HTMLInputElement>("#partColor");
const applyColorButton = document.querySelector<HTMLButtonElement>("#applyColor");
const rotateAxisSelect = document.querySelector<HTMLSelectElement>("#rotateAxis");
const rotateDegreesInput = document.querySelector<HTMLInputElement>("#rotateDegrees");
const rotateMinusButton = document.querySelector<HTMLButtonElement>("#rotateMinus");
const rotatePlusButton = document.querySelector<HTMLButtonElement>("#rotatePlus");
const mergeButton = document.querySelector<HTMLButtonElement>("#mergeParts");
const clearButton = document.querySelector<HTMLButtonElement>("#clearScene");
const statusLabel = document.querySelector<HTMLSpanElement>("#sceneStatus");

if (
  !fileInput ||
  !loadDuckButton ||
  !autoAlignToggle ||
  !partSelect ||
  !partColorInput ||
  !applyColorButton ||
  !rotateAxisSelect ||
  !rotateDegreesInput ||
  !rotateMinusButton ||
  !rotatePlusButton ||
  !mergeButton ||
  !clearButton ||
  !statusLabel
) {
  throw new Error("Viewer controls were not found in index.html.");
}

gl.clearColor(0.05, 0.08, 0.12, 1);
gl.enable(gl.DEPTH_TEST);

const vertexSrc = await Shader.getShaderSource("vertex.vert");
const fragmentSrc = await Shader.getShaderSource("fragment.frag");

const state = {
  parts: [] as MeshPart[],
  merged: null as MeshPart | null,
  modelOffset: null as vec3 | null,
  autoAlign: autoAlignToggle.checked,
  selectedPartId: "",
};
const sceneOrigin = vec3.fromValues(0, 0, 0);
const orbit = {
  target: vec3.fromValues(0, 0, 0),
  distance: 5,
  yaw: 0,
  pitch: 0.2,
  minDistance: 0.25,
  maxDistance: 500,
  dragging: false,
  sensitivity: 0.006,
};

const partColors: [number, number, number][] = [
  [0.86, 0.31, 0.25],
  [0.17, 0.58, 0.76],
  [0.2, 0.65, 0.35],
  [0.95, 0.74, 0.2],
  [0.65, 0.45, 0.9],
  [0.9, 0.45, 0.7],
];

function createMesh(name: string, vertices: Float32Array, indices: Uint32Array): Mesh {
  const mesh = new Mesh(name, gl.TRIANGLES, vertices, indices, vertexSrc, fragmentSrc);
  mesh.SetLocation(0, 3, 24, 0);
  mesh.SetLocation(1, 3, 24, 12);
  return mesh;
}

function updateStatus(): void {
  const partCount = state.parts.length;
  const mergedLabel = state.merged ? " | merged: yes" : "";
  const alignLabel = state.autoAlign ? " | align: on" : " | align: off";
  statusLabel.textContent = `parts: ${partCount}${mergedLabel}${alignLabel}`;
}

function colorToHex(color: [number, number, number]): string {
  const r = Math.round(Math.min(1, Math.max(0, color[0])) * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(Math.min(1, Math.max(0, color[1])) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(Math.min(1, Math.max(0, color[2])) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToColor(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const parsed = normalized.length === 6 ? normalized : "ffffff";
  const r = parseInt(parsed.slice(0, 2), 16) / 255;
  const g = parseInt(parsed.slice(2, 4), 16) / 255;
  const b = parseInt(parsed.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function interleavePositionsWithColor(
  positions: Float32Array,
  color: [number, number, number],
): Float32Array {
  const vertices = new Float32Array((positions.length / 3) * 6);
  let src = 0;
  let dst = 0;

  while (src < positions.length) {
    vertices[dst++] = positions[src++];
    vertices[dst++] = positions[src++];
    vertices[dst++] = positions[src++];
    vertices[dst++] = color[0];
    vertices[dst++] = color[1];
    vertices[dst++] = color[2];
  }

  return vertices;
}

function getSpawnForwardVector(): vec3 {
  return vec3.fromValues(0, 0, 1);
}

function applyOffset(positions: Float32Array, offset: vec3): Float32Array {
  const shifted = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    shifted[i] = positions[i] + offset[0];
    shifted[i + 1] = positions[i + 1] + offset[1];
    shifted[i + 2] = positions[i + 2] + offset[2];
  }
  return shifted;
}

function computeBoundsFromVertexData(vertices: Float32Array[]): { min: vec3; max: vec3 } | null {
  if (vertices.length === 0) return null;

  const min = vec3.fromValues(Infinity, Infinity, Infinity);
  const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

  for (const data of vertices) {
    for (let i = 0; i < data.length; i += 6) {
      const x = data[i];
      const y = data[i + 1];
      const z = data[i + 2];
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }

  return { min, max };
}

function computeBoundsFromPositionArrays(arrays: Float32Array[]): { min: vec3; max: vec3 } | null {
  if (arrays.length === 0) return null;

  const min = vec3.fromValues(Infinity, Infinity, Infinity);
  const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);

  for (const data of arrays) {
    for (let i = 0; i < data.length; i += 3) {
      const x = data[i];
      const y = data[i + 1];
      const z = data[i + 2];
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }

  return { min, max };
}

function samplePointsFromPartVertices(parts: MeshPart[], maxPoints: number): Float32Array {
  if (parts.length === 0) return new Float32Array(0);
  let total = 0;
  for (const part of parts) total += part.positions.length / 3;
  const step = Math.max(1, Math.floor(total / maxPoints));

  const sampled: number[] = [];
  let globalIndex = 0;
  for (const part of parts) {
    const data = part.positions;
    for (let i = 0; i < data.length; i += 3) {
      if (globalIndex % step === 0) sampled.push(data[i], data[i + 1], data[i + 2]);
      globalIndex++;
    }
  }

  return new Float32Array(sampled);
}

function samplePointsFromPositionArrays(arrays: Float32Array[], maxPoints: number): Float32Array {
  if (arrays.length === 0) return new Float32Array(0);
  let total = 0;
  for (const array of arrays) total += array.length / 3;
  const step = Math.max(1, Math.floor(total / maxPoints));

  const sampled: number[] = [];
  let globalIndex = 0;
  for (const array of arrays) {
    for (let i = 0; i < array.length; i += 3) {
      if (globalIndex % step === 0) sampled.push(array[i], array[i + 1], array[i + 2]);
      globalIndex++;
    }
  }

  return new Float32Array(sampled);
}

function transformPoint(rotation: number[], translation: vec3, x: number, y: number, z: number): vec3 {
  return vec3.fromValues(
    rotation[0] * x + rotation[1] * y + rotation[2] * z + translation[0],
    rotation[3] * x + rotation[4] * y + rotation[5] * z + translation[1],
    rotation[6] * x + rotation[7] * y + rotation[8] * z + translation[2],
  );
}

function transformPositionsRigid(
  positions: Float32Array,
  rotation: number[],
  translation: vec3,
): Float32Array {
  const transformed = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const p = transformPoint(rotation, translation, positions[i], positions[i + 1], positions[i + 2]);
    transformed[i] = p[0];
    transformed[i + 1] = p[1];
    transformed[i + 2] = p[2];
  }
  return transformed;
}

function computeCentroid(points: Float32Array): vec3 {
  const c = vec3.fromValues(0, 0, 0);
  const n = points.length / 3;
  if (n === 0) return c;
  for (let i = 0; i < points.length; i += 3) {
    c[0] += points[i];
    c[1] += points[i + 1];
    c[2] += points[i + 2];
  }
  c[0] /= n;
  c[1] /= n;
  c[2] /= n;
  return c;
}

function getNearestNeighborPairs(
  source: Float32Array,
  target: Float32Array,
): { matches: Float32Array; distances: Float32Array } {
  const matches = new Float32Array(source.length);
  const distances = new Float32Array(source.length / 3);
  if (target.length === 0) return { matches, distances };

  for (let i = 0; i < source.length; i += 3) {
    const sx = source[i];
    const sy = source[i + 1];
    const sz = source[i + 2];
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let j = 0; j < target.length; j += 3) {
      const dx = sx - target[j];
      const dy = sy - target[j + 1];
      const dz = sz - target[j + 2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < bestDist) {
        bestDist = d2;
        best = j;
      }
    }

    matches[i] = target[best];
    matches[i + 1] = target[best + 1];
    matches[i + 2] = target[best + 2];
    distances[i / 3] = Math.sqrt(bestDist);
  }

  return { matches, distances };
}

function normalizeVec4(v: number[]): number[] {
  const len = Math.hypot(v[0], v[1], v[2], v[3]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len, v[3] / len];
}

function rotationFromCovariance(
  sxx: number,
  sxy: number,
  sxz: number,
  syx: number,
  syy: number,
  syz: number,
  szx: number,
  szy: number,
  szz: number,
): number[] {
  const trace = sxx + syy + szz;
  const k = [
    [trace, syz - szy, szx - sxz, sxy - syx],
    [syz - szy, sxx - syy - szz, sxy + syx, szx + sxz],
    [szx - sxz, sxy + syx, -sxx + syy - szz, syz + szy],
    [sxy - syx, szx + sxz, syz + szy, -sxx - syy + szz],
  ];

  let q = [1, 0, 0, 0];
  for (let iter = 0; iter < 24; iter++) {
    const next = [
      k[0][0] * q[0] + k[0][1] * q[1] + k[0][2] * q[2] + k[0][3] * q[3],
      k[1][0] * q[0] + k[1][1] * q[1] + k[1][2] * q[2] + k[1][3] * q[3],
      k[2][0] * q[0] + k[2][1] * q[1] + k[2][2] * q[2] + k[2][3] * q[3],
      k[3][0] * q[0] + k[3][1] * q[1] + k[3][2] * q[2] + k[3][3] * q[3],
    ];
    q = normalizeVec4(next);
  }

  const w = q[0];
  const x = q[1];
  const y = q[2];
  const z = q[3];

  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - z * w),
    2 * (x * z + y * w),
    2 * (x * y + z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z - x * w),
    2 * (x * z - y * w),
    2 * (y * z + x * w),
    1 - 2 * (x * x + y * y),
  ];
}

function solveRigidTransform(source: Float32Array, target: Float32Array): { rotation: number[]; translation: vec3 } {
  const cs = computeCentroid(source);
  const ct = computeCentroid(target);

  let sxx = 0;
  let sxy = 0;
  let sxz = 0;
  let syx = 0;
  let syy = 0;
  let syz = 0;
  let szx = 0;
  let szy = 0;
  let szz = 0;

  for (let i = 0; i < source.length; i += 3) {
    const px = source[i] - cs[0];
    const py = source[i + 1] - cs[1];
    const pz = source[i + 2] - cs[2];

    const qx = target[i] - ct[0];
    const qy = target[i + 1] - ct[1];
    const qz = target[i + 2] - ct[2];

    sxx += px * qx;
    sxy += px * qy;
    sxz += px * qz;
    syx += py * qx;
    syy += py * qy;
    syz += py * qz;
    szx += pz * qx;
    szy += pz * qy;
    szz += pz * qz;
  }

  const rotation = rotationFromCovariance(sxx, sxy, sxz, syx, syy, syz, szx, szy, szz);
  const centerRotated = transformPoint(rotation, vec3.fromValues(0, 0, 0), cs[0], cs[1], cs[2]);
  const translation = vec3.fromValues(
    ct[0] - centerRotated[0],
    ct[1] - centerRotated[1],
    ct[2] - centerRotated[2],
  );

  return { rotation, translation };
}

function composeRotation(a: number[], b: number[]): number[] {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

function identityRotation(): number[] {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function runRigidICP(
  source: Float32Array,
  target: Float32Array,
  iterations: number = 10,
  keepFraction: number = 0.2,
): { rotation: number[]; translation: vec3 } {
  let totalRotation = identityRotation();
  let totalTranslation = vec3.fromValues(0, 0, 0);
  if (source.length === 0 || target.length === 0) {
    return { rotation: totalRotation, translation: totalTranslation };
  }

  let transformed = source;
  for (let iter = 0; iter < iterations; iter++) {
    const { matches, distances } = getNearestNeighborPairs(transformed, target);
    const order = Array.from({ length: distances.length }, (_, idx) => idx).sort(
      (a, b) => distances[a] - distances[b],
    );
    const keepCount = Math.max(12, Math.floor(order.length * keepFraction));
    const trimmedSource = new Float32Array(keepCount * 3);
    const trimmedTarget = new Float32Array(keepCount * 3);
    for (let i = 0; i < keepCount; i++) {
      const srcIdx = order[i] * 3;
      trimmedSource[i * 3] = transformed[srcIdx];
      trimmedSource[i * 3 + 1] = transformed[srcIdx + 1];
      trimmedSource[i * 3 + 2] = transformed[srcIdx + 2];
      trimmedTarget[i * 3] = matches[srcIdx];
      trimmedTarget[i * 3 + 1] = matches[srcIdx + 1];
      trimmedTarget[i * 3 + 2] = matches[srcIdx + 2];
    }

    const step = solveRigidTransform(trimmedSource, trimmedTarget);
    totalRotation = composeRotation(step.rotation, totalRotation);
    totalTranslation = transformPoint(
      step.rotation,
      step.translation,
      totalTranslation[0],
      totalTranslation[1],
      totalTranslation[2],
    );
    transformed = transformPositionsRigid(source, totalRotation, totalTranslation);
  }

  return { rotation: totalRotation, translation: totalTranslation };
}

function rotatePositionsAroundPivot(
  positions: Float32Array,
  rotation: number[],
  pivot: vec3,
): Float32Array {
  const rotated = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] - pivot[0];
    const y = positions[i + 1] - pivot[1];
    const z = positions[i + 2] - pivot[2];
    rotated[i] = rotation[0] * x + rotation[1] * y + rotation[2] * z + pivot[0];
    rotated[i + 1] = rotation[3] * x + rotation[4] * y + rotation[5] * z + pivot[1];
    rotated[i + 2] = rotation[6] * x + rotation[7] * y + rotation[8] * z + pivot[2];
  }
  return rotated;
}

function rotationZ(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function rotationX(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rotationY(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function getRotationMatrixForAxis(axis: string, angleRadians: number): number[] {
  if (axis === "x") return rotationX(angleRadians);
  if (axis === "y") return rotationY(angleRadians);
  return rotationZ(angleRadians);
}

function alignmentScore(source: Float32Array, target: Float32Array, overlapDistance: number): number {
  const { distances } = getNearestNeighborPairs(source, target);
  const sorted = Array.from(distances).sort((a, b) => a - b);
  const nearCount = Math.max(6, Math.floor(sorted.length * 0.15));
  let meanNear = 0;
  for (let i = 0; i < nearCount; i++) meanNear += sorted[i];
  meanNear /= nearCount;

  let overlapCount = 0;
  for (let i = 0; i < distances.length; i++) {
    if (distances[i] < overlapDistance) overlapCount++;
  }
  const overlapRatio = overlapCount / Math.max(1, distances.length);
  const overlapPenalty = overlapRatio > 0.4 ? (overlapRatio - 0.4) * 8 : 0;

  return meanNear + overlapPenalty;
}

function runTranslationICP(
  source: Float32Array,
  target: Float32Array,
  iterations: number = 12,
  keepFraction: number = 0.18,
): vec3 {
  const total = vec3.fromValues(0, 0, 0);
  if (source.length === 0 || target.length === 0) return total;

  let transformed = source;
  for (let iter = 0; iter < iterations; iter++) {
    const { matches, distances } = getNearestNeighborPairs(transformed, target);
    const order = Array.from({ length: distances.length }, (_, idx) => idx).sort(
      (a, b) => distances[a] - distances[b],
    );
    const keepCount = Math.max(12, Math.floor(order.length * keepFraction));

    const delta = vec3.fromValues(0, 0, 0);
    for (let i = 0; i < keepCount; i++) {
      const idx = order[i] * 3;
      delta[0] += matches[idx] - transformed[idx];
      delta[1] += matches[idx + 1] - transformed[idx + 1];
      delta[2] += matches[idx + 2] - transformed[idx + 2];
    }
    delta[0] /= keepCount;
    delta[1] /= keepCount;
    delta[2] /= keepCount;

    vec3.add(total, total, delta);
    transformed = applyOffset(source, total);
    if (vec3.length(delta) < 0.0005) break;
  }

  return total;
}

function rebuildPartMesh(part: MeshPart): void {
  part.mesh.delete();
  part.vertices = interleavePositionsWithColor(part.positions, part.color);
  part.mesh = createMesh(`part-${part.id}`, part.vertices, part.indices);
}

function getSelectedPart(): MeshPart | null {
  return state.parts.find((part) => part.id === state.selectedPartId) ?? null;
}

function rotateSelectedPart(sign: 1 | -1): void {
  const selected = getSelectedPart();
  if (!selected) return;

  const degrees = Number(rotateDegreesInput.value);
  if (!Number.isFinite(degrees) || degrees <= 0) return;

  const axis = rotateAxisSelect.value;
  const angleRadians = (degrees * Math.PI) / 180 * sign;
  const rotation = getRotationMatrixForAxis(axis, angleRadians);
  const pivot = computeCentroid(selected.positions);
  selected.positions = rotatePositionsAroundPivot(selected.positions, rotation, pivot);
  rebuildPartMesh(selected);

  const loadedBounds = computeBoundsFromPositionArrays(state.parts.map((part) => part.positions));
  if (loadedBounds) focusOnBounds(loadedBounds.min, loadedBounds.max);
}

function refreshPartSelect(): void {
  const previous = state.selectedPartId;
  partSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Part";
  partSelect.appendChild(placeholder);

  for (const part of state.parts) {
    const option = document.createElement("option");
    option.value = part.id;
    option.textContent = part.name;
    partSelect.appendChild(option);
  }

  if (state.parts.some((part) => part.id === previous)) {
    partSelect.value = previous;
    state.selectedPartId = previous;
  } else if (state.parts.length > 0) {
    partSelect.value = state.parts[0].id;
    state.selectedPartId = state.parts[0].id;
  } else {
    partSelect.value = "";
    state.selectedPartId = "";
  }

  const selected = state.parts.find((part) => part.id === state.selectedPartId);
  if (selected) {
    partColorInput.value = colorToHex(selected.color);
  }
}

function focusOnBounds(min: vec3, max: vec3): void {
  const center = vec3.fromValues(
    (min[0] + max[0]) * 0.5,
    (min[1] + max[1]) * 0.5,
    (min[2] + max[2]) * 0.5,
  );
  const size = vec3.fromValues(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  const radius = Math.max(vec3.length(size) * 0.5, 0.5);
  vec3.copy(orbit.target, center);
  orbit.distance = Math.min(Math.max(radius * 2.2, 2), orbit.maxDistance);
}

function getBoundsFromPending(pending: PendingGeometry[]): { min: vec3; max: vec3 } | null {
  if (pending.length === 0) {
    return null;
  }

  const min = vec3.fromValues(Infinity, Infinity, Infinity);
  const max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
  for (const item of pending) {
    const positions = item.positions;
    for (let p = 0; p < positions.length; p += 3) {
      const x = positions[p];
      const y = positions[p + 1];
      const z = positions[p + 2];
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  }
  return { min, max };
}

async function buildPendingFromFiles(files: FileList): Promise<PendingGeometry[]> {
  const pending: PendingGeometry[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    if (!file || !file.name.toLowerCase().endsWith(".stl")) continue;
    const geometry = await parseSTLFile(file);
    pending.push({
      fileName: file.name,
      positions: geometry.positions,
      indices: geometry.indices,
    });
  }
  return pending;
}

async function buildPendingFromPublic(paths: string[]): Promise<PendingGeometry[]> {
  const pending: PendingGeometry[] = [];
  for (const path of paths) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    const geometry = parseSTLArrayBuffer(await response.arrayBuffer());
    pending.push({
      fileName: path.split("/").pop() ?? path,
      positions: geometry.positions,
      indices: geometry.indices,
    });
  }
  return pending;
}

function loadPendingGeometries(pending: PendingGeometry[]): void {
  state.merged?.mesh.delete();
  state.merged = null;

  const bounds = getBoundsFromPending(pending);
  if (!bounds) {
    updateStatus();
    return;
  }

  const center = vec3.fromValues(
    (bounds.min[0] + bounds.max[0]) * 0.5,
    (bounds.min[1] + bounds.max[1]) * 0.5,
    (bounds.min[2] + bounds.max[2]) * 0.5,
  );
  const size = vec3.fromValues(
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  );
  const radius = Math.max(vec3.length(size) * 0.5, 0.5);

  if (!state.modelOffset) {
    const targetCenter = vec3.clone(sceneOrigin);
    state.modelOffset = vec3.create();
    vec3.subtract(state.modelOffset, targetCenter, center);
  }

  const offset = state.modelOffset;
  if (!offset) return;

  let positionedPending = pending.map((item) => ({
    fileName: item.fileName,
    indices: item.indices,
    positions: applyOffset(item.positions, offset),
  }));

  if (state.autoAlign) {
    const assembled: Float32Array[] = state.parts.map((part) => part.positions);

    for (let i = 0; i < positionedPending.length; i++) {
      const current = positionedPending[i];
      if (assembled.length === 0) {
        assembled.push(current.positions);
        continue;
      }

      const sourceBounds = computeBoundsFromPositionArrays([current.positions]);
      const targetBounds = computeBoundsFromPositionArrays(assembled);
      if (!sourceBounds || !targetBounds) {
        assembled.push(current.positions);
        continue;
      }

      const sourceCenter = vec3.fromValues(
        (sourceBounds.min[0] + sourceBounds.max[0]) * 0.5,
        (sourceBounds.min[1] + sourceBounds.max[1]) * 0.5,
        (sourceBounds.min[2] + sourceBounds.max[2]) * 0.5,
      );
      const targetCenter = vec3.fromValues(
        (targetBounds.min[0] + targetBounds.max[0]) * 0.5,
        (targetBounds.min[1] + targetBounds.max[1]) * 0.5,
        (targetBounds.min[2] + targetBounds.max[2]) * 0.5,
      );

      const sourceSize = vec3.fromValues(
        sourceBounds.max[0] - sourceBounds.min[0],
        sourceBounds.max[1] - sourceBounds.min[1],
        sourceBounds.max[2] - sourceBounds.min[2],
      );
      const targetSize = vec3.fromValues(
        targetBounds.max[0] - targetBounds.min[0],
        targetBounds.max[1] - targetBounds.min[1],
        targetBounds.max[2] - targetBounds.min[2],
      );

      const sourceRadius = Math.max(vec3.length(sourceSize) * 0.5, 0.5);
      const targetRadius = Math.max(vec3.length(targetSize) * 0.5, 0.5);
      const centerDelta = vec3.create();
      vec3.subtract(centerDelta, sourceCenter, targetCenter);
      const isFar = vec3.length(centerDelta) > (sourceRadius + targetRadius) * 0.75;

      if (isFar) {
        const sourceSample = samplePointsFromPositionArrays([current.positions], 700);
        const targetSample = samplePointsFromPositionArrays(assembled, 1500);
        const pivot = sourceCenter;
        const overlapDistance = Math.max(targetRadius * 0.015, 0.2);
        const rotationCandidates = [
          identityRotation(),
          rotationZ(Math.PI / 2),
          rotationZ(Math.PI),
          rotationZ(-Math.PI / 2),
        ];

        let bestScore = Number.POSITIVE_INFINITY;
        let bestPositions = current.positions;

        for (const candidateRotation of rotationCandidates) {
          const rotatedSample = rotatePositionsAroundPivot(sourceSample, candidateRotation, pivot);
          const delta = runTranslationICP(rotatedSample, targetSample, 12, 0.18);
          const transformedSample = applyOffset(rotatedSample, delta);
          const score = alignmentScore(transformedSample, targetSample, overlapDistance);
          if (score < bestScore) {
            bestScore = score;
            const rotatedFull = rotatePositionsAroundPivot(current.positions, candidateRotation, pivot);
            bestPositions = applyOffset(rotatedFull, delta);
          }
        }

        current.positions = bestPositions;
      }

      assembled.push(current.positions);
    }
  }

  for (let i = 0; i < positionedPending.length; i++) {
    const color = partColors[(state.parts.length + i) % partColors.length];
    const positions = positionedPending[i].positions;
    const vertices = interleavePositionsWithColor(positions, color);
    const partId = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
    const part = {
      id: partId,
      name: positionedPending[i].fileName,
      positions,
      color,
      vertices,
      indices: positionedPending[i].indices,
      mesh: createMesh(`part-${partId}`, vertices, positionedPending[i].indices),
    };

    state.parts.push(part);
  }

  const loadedBounds = computeBoundsFromPositionArrays(state.parts.map((part) => part.positions));
  if (loadedBounds) focusOnBounds(loadedBounds.min, loadedBounds.max);
  refreshPartSelect();
  updateStatus();
}

async function loadFiles(files: FileList): Promise<void> {
  const pending = await buildPendingFromFiles(files);
  loadPendingGeometries(pending);
}

async function loadProjectDuck(): Promise<void> {
  const duckPaths = [
    "/head.stl",
    "/Duck.stl_B_A_A.stl",
    "/Duck.stl_B_A_B.stl",
    "/Duck.stl_B_B_A.stl",
    "/Duck.stl_B_B_B.stl",
  ];

  clearScene();
  const pending = await buildPendingFromPublic(duckPaths);
  loadPendingGeometries(pending);
}

function mergeParts(): void {
  if (state.parts.length < 2) return;

  state.merged?.mesh.delete();

  let vertexLength = 0;
  let indexLength = 0;
  for (const part of state.parts) {
    vertexLength += part.vertices.length;
    indexLength += part.indices.length;
  }

  const mergedVertices = new Float32Array(vertexLength);
  const mergedIndices = new Uint32Array(indexLength);
  let vertexOffset = 0;
  let indexOffset = 0;
  let baseVertex = 0;

  for (const part of state.parts) {
    mergedVertices.set(part.vertices, vertexOffset);

    for (let i = 0; i < part.indices.length; i++) {
      mergedIndices[indexOffset + i] = part.indices[i] + baseVertex;
    }

    vertexOffset += part.vertices.length;
    indexOffset += part.indices.length;
    baseVertex += part.vertices.length / 6;
    part.mesh.delete();
  }

  const merged = createMesh("merged-model", mergedVertices, mergedIndices);
  state.merged = {
    name: "merged-model",
    vertices: mergedVertices,
    indices: mergedIndices,
    mesh: merged,
  };
  state.parts = [];
  const mergedBounds = computeBoundsFromVertexData([mergedVertices]);
  if (mergedBounds) focusOnBounds(mergedBounds.min, mergedBounds.max);
  refreshPartSelect();
  updateStatus();
}

function clearScene(): void {
  for (const part of state.parts) part.mesh.delete();
  state.parts = [];
  state.merged?.mesh.delete();
  state.merged = null;
  state.modelOffset = null;
  vec3.copy(orbit.target, sceneOrigin);
  orbit.distance = 5;
  refreshPartSelect();
  updateStatus();
}

fileInput.addEventListener("change", async () => {
  if (!fileInput.files || fileInput.files.length === 0) return;
  try {
    await loadFiles(fileInput.files);
    fileInput.value = "";
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "failed to load STL";
  }
});

loadDuckButton.addEventListener("click", async () => {
  try {
    statusLabel.textContent = "loading project duck...";
    await loadProjectDuck();
  } catch (error) {
    console.error(error);
    statusLabel.textContent = "failed to load project duck";
  }
});

mergeButton.addEventListener("click", () => mergeParts());
clearButton.addEventListener("click", () => clearScene());
autoAlignToggle.addEventListener("change", () => {
  state.autoAlign = autoAlignToggle.checked;
  updateStatus();
});

partSelect.addEventListener("change", () => {
  state.selectedPartId = partSelect.value;
  const selected = state.parts.find((part) => part.id === state.selectedPartId);
  if (selected) {
    partColorInput.value = colorToHex(selected.color);
  }
});

applyColorButton.addEventListener("click", () => {
  const selected = state.parts.find((part) => part.id === state.selectedPartId);
  if (!selected) return;

  selected.color = hexToColor(partColorInput.value);
  rebuildPartMesh(selected);
});

rotateMinusButton.addEventListener("click", () => rotateSelectedPart(-1));
rotatePlusButton.addEventListener("click", () => rotateSelectedPart(1));

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;
  orbit.dragging = true;
});

document.addEventListener("mousemove", (event) => {
  if (!orbit.dragging) return;
  orbit.yaw -= event.movementX * orbit.sensitivity;
  orbit.pitch -= event.movementY * orbit.sensitivity;
  if (orbit.pitch < -1.5) orbit.pitch = -1.5;
  if (orbit.pitch > 1.5) orbit.pitch = 1.5;
});

document.addEventListener("mouseup", () => {
  orbit.dragging = false;
});

canvas.addEventListener("mouseleave", () => {
  orbit.dragging = false;
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const zoomFactor = 1 + event.deltaY * 0.001;
    orbit.distance = Math.min(
      Math.max(orbit.distance * zoomFactor, orbit.minDistance),
      orbit.maxDistance,
    );
  },
  { passive: false },
);

function drawMesh(mesh: Mesh): void {
  mesh.shaderProgram.useProgram();
  const id = mesh.shaderProgram.ID;
  gl.uniformMatrix4fv(gl.getUniformLocation(id, "view"), false, view);
  gl.uniformMatrix4fv(gl.getUniformLocation(id, "model"), false, model);
  gl.uniformMatrix4fv(gl.getUniformLocation(id, "proj"), false, projection);
  mesh.Draw();
}

let lastTime = 0;
function loop(nowMS: number): void {
  const now = nowMS * 0.001;
  lastTime = now;

  mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.01, 2000);
  const cosPitch = Math.cos(orbit.pitch);
  const cameraPosition = vec3.fromValues(
    orbit.target[0] + orbit.distance * Math.sin(orbit.yaw) * cosPitch,
    orbit.target[1] + orbit.distance * Math.sin(orbit.pitch),
    orbit.target[2] + orbit.distance * Math.cos(orbit.yaw) * cosPitch,
  );
  vec3.copy(camera.position, cameraPosition);
  mat4.lookAt(view, camera.position, orbit.target, [0, 1, 0]);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (state.merged) {
    drawMesh(state.merged.mesh);
  } else {
    for (const part of state.parts) drawMesh(part.mesh);
  }

  requestAnimationFrame(loop);
}

updateStatus();
requestAnimationFrame(loop);
