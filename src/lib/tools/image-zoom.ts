const zoomLevelsPlus: number[] = [1, 2, 4, 8];
const zoomLevelsMinus: number[] = [1, 0.5, 0.25, 0.125];

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
