export function unixTime2str(unixTime: number | null | undefined) {
  if (unixTime === null || unixTime === undefined) return '';
  return new Date(unixTime * 1000)
    .toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\./g, '/');
}

// Windows,Linuxのフルパスから最後の要素を取得する
// ※ 最上位ディレクトリの場合はそのまま返す
export function getPathBasename(s: string): string {
  // 末尾の / または \ を除去
  const trimmed = s.replace(/[\\/]+$/, '');

  // 区切り文字で split（Windows: \, Linux: /）
  const parts = trimmed.split(/[\\/]/);

  return parts[parts.length - 1];
}

export function errToStr(e: unknown) {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
