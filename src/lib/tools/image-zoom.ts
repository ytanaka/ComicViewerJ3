const zoomLevelsNeg: number[] = [1, 0.5, 0.25, 0.125];
const zoomLevelsPos: number[] = [1, 2, 4, 8];

export function zoomLevel2ZoomRatio(level: number): number {
  const lv = zoomLevelNormalize(level);
  if (lv < 0) {
    return zoomLevelsNeg[lv * -1];
  } else {
    return zoomLevelsPos[lv];
  }
}

export function zoomLevelNormalize(level: number): number {
  let lv = level;
  if (lv < 0) {
    lv *= -1;
    return -1 * Math.min(lv, zoomLevelsNeg.length - 1);
  } else {
    return Math.min(lv, zoomLevelsPos.length - 1);
  }
}
