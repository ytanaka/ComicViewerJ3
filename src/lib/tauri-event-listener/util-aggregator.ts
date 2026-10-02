export class EventAggregator<T> {
  private eventHandler: (t: T) => Promise<void>;

  private delayMs: number;
  private pending: T | null;
  private timer: number | null;

  constructor(delayMs: number, eventHandler: (t: T) => Promise<void>) {
    this.eventHandler = eventHandler;

    this.delayMs = delayMs;
    this.pending = null;
    this.timer = null;
  }

  async emit(event: T): Promise<boolean> {
    // 保留中のイベントがないなら保留する
    if (this.pending === null) {
      this.pending = event;
      this.startTimer();
      return true;
    }

    // 保留中と同じイベントなら無視
    if (this.isSameEvent(this.pending, event)) {
      return false;
    }

    // 別イベントが来たら、現在の保留イベントを処理して、新しいイベントを保留する
    await this.process(this.pending);
    this.pending = event;
    this.startTimer();
    return true;
  }

  private startTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(async () => {
      this.timer = null;

      if (this.pending !== null) {
        const event = this.pending;
        this.pending = null;

        await this.process(event);
      }
    }, this.delayMs);
  }

  private isSameEvent(a: T, b: T) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  async process(event: T) {
    await this.eventHandler(event)
  }
}
