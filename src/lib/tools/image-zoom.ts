import { Dimension } from '../bindings';

const zoomLevelsPlus: number[] = [1, 1.5, 2, 3, 4];
const zoomLevelsMinus: number[] = [1, 0.75, 0.5, 0.25, 0.125];

export function zoomDimension(level: number, size: Dimension | null): Dimension | null {
  if (!size) return null;
  const ratio = zoomLevel2ZoomRatio(level);
  return {
    width: Math.round(size.width * ratio),
    height: Math.round(size.height * ratio),
  };
}

export function zoomLevel2ZoomRatio(level: number): number {
  const lv = zoomLevelNormalize(level);
  if (lv < 0) {
    return zoomLevelsMinus[lv * -1];
  } else {
    return zoomLevelsPlus[lv];
  }
}

export function zoomLevelNormalize(level: number): number {
  let lv = level;
  if (lv < 0) {
    lv *= -1;
    return -1 * Math.min(lv, zoomLevelsMinus.length - 1);
  } else {
    return Math.min(lv, zoomLevelsPlus.length - 1);
  }
}
