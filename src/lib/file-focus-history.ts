const MAX_HIST = 10;

export class FileFocusHistory {
  histNum: number;

  // 先頭が古いデータ
  hist: HistElm[] = [];

  constructor(histNum: number = MAX_HIST) {
    this.histNum = histNum;
  }

  push(path: string, focusName: string) {
    this.hist = this.hist.filter(e => e.path !== path);
    this.hist.push({ path, focusName });
    if (this.histNum < this.hist.length) {
      this.hist.splice(0, this.hist.length - this.histNum);
    }
  }

  find(path: string): string | undefined {
    return this.hist.find(h => h.path === path)?.focusName;
  }
}

interface HistElm {
  path: string;
  focusName: string;
}
