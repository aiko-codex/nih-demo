export const minimumScale = 1;
export const maximumScale = 3;
const buildingCenterY = 0.47;

const festiveColors = ["#F5A524", "#E94C9A", "#36C7B5", "#FFD166", "#A78BFA", "#FF7A45"];

export function colorForSlot(slotKey) {
  let hash = 0;
  for (const character of slotKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return festiveColors[hash % festiveColors.length];
}

export function coverSize(viewport, imageRatio) {
  const width = Math.max(viewport.width, viewport.height * imageRatio);
  return { width, height: width / imageRatio };
}

export function clampView(view, viewport, content) {
  const scale = Math.min(maximumScale, Math.max(minimumScale, view.scale));
  const minX = viewport.width - content.width * scale;
  const minY = viewport.height - content.height * scale;
  return {
    scale,
    x: Math.min(0, Math.max(minX, view.x)),
    y: Math.min(0, Math.max(minY, view.y)),
  };
}

export function restingView(viewport, content) {
  const view = {
    scale: 1,
    x: (viewport.width - content.width) / 2,
    y: viewport.height * 0.44 - content.height * buildingCenterY,
  };
  return clampView(view, viewport, content);
}

export function pointerDistance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}
