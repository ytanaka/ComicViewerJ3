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
