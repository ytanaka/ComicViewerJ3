const MAX_HIST = 10;

export class FileFocusHistory {
  // 先頭が古いデータ
  hist: HistElm[] = [];

  constructor() { }

  push(path: string, focusName: string) {
    this.hist = this.hist.filter((e) => e.path === path);
    this.hist.push({ path, focusName });
    if (MAX_HIST < this.hist.length) {
      this.hist.splice(0, this.hist.length - MAX_HIST);
    }
  }

  find(path: string): string | undefined {
    return this.hist.find((h) => h.path === path)?.focusName
  }
}

interface HistElm {
  path: string,
  focusName: string,
}
