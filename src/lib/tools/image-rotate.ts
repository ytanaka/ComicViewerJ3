export function normalizeRotateLevel(n: number): number {
  while (n < 0) n += 4;
  while (4 <= n) n -= 4;
  return n;
}

export function rotateLevel2Deg(n: number) {
  return n * 90;
}
