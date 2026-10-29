export const FLOORS = 10;
export const FLOOR_HEIGHT = 3.5;
export const WINDOW_WIDTH = 0.78;
export const WINDOW_HEIGHT = 2.12;
export const FRONT_WIDTH = 12;
export const WING_LENGTH = 6;
export const WING_ANGLE = Math.PI / 180 * 40;

const FACE_ROTATION = {
  left: -WING_ANGLE,
  front: 0,
  right: WING_ANGLE,
};

function faceWidth(face, faces = {}) {
  const defaultWidths = { left: 6, front: 12, right: 6 };
  return Number(faces[face]) || defaultWidths[face] || 0;
}

export function getWindowTransform(face, floor, column, faces = {}) {
  const width = faceWidth(face, faces);
  const angle = FACE_ROTATION[face];
  if (!width || angle === undefined) return null;

  const alongFace = column + 0.5 - width / 2;
  const faceOffset = face === "front" ? 0 : WING_LENGTH / 2;
  const side = face === "left" ? -1 : 1;
  const centerX = face === "front" ? 0 : side * (FRONT_WIDTH / 2 + Math.cos(WING_ANGLE) * faceOffset);
  const centerZ = face === "front" ? 0 : -Math.sin(WING_ANGLE) * faceOffset;
  const position = [
    centerX + Math.cos(angle) * alongFace,
    (floor - 0.5) * FLOOR_HEIGHT,
    centerZ - Math.sin(angle) * alongFace,
  ];

  return { position, rotationY: angle, width: WINDOW_WIDTH, height: WINDOW_HEIGHT };
}

export function getBlockWindows(block, faces = {}) {
  if (!block || !FACE_ROTATION[block.face]) {
    if (!block || block.face !== "front") return [];
  }
  const start = Math.max(0, Number(block.windowStart) || 0);
  const span = Math.max(0, Number(block.windowSpan) || 0);
  return Array.from({ length: span }, (_, index) =>
    getWindowTransform(block.face, Number(block.floor), start + index, faces),
  ).filter(Boolean);
}

export function getFloorCenter(floor) {
  return [0, (Number(floor) - 0.5) * FLOOR_HEIGHT, 0];
}
