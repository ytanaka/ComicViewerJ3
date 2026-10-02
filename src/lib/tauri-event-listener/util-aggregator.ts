export class EventAggregator<T> {
  private eventHandler: (t: T) => Promise<void>;
  private canIgnoreNewEvent: (pendingEvent: T, arriveEvent: T) => boolean;

  private delayMs: number;
  private pending: T | null;
  private timer: number | null;

  constructor(
    delayMs: number,
    eventHandler: (t: T) => Promise<void>,
    canIgnoreNewEvent: (pendingEvent: T, arriveEvent: T) => boolean
  ) {
    this.eventHandler = eventHandler;
    this.canIgnoreNewEvent = canIgnoreNewEvent;

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
    if (this.canIgnoreNewEvent(this.pending, event)) {
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
      window.clearTimeout(this.timer);
    }

    this.timer = window.setTimeout(async () => {
      this.timer = null;

      if (this.pending !== null) {
        const event = this.pending;
        this.pending = null;

        await this.process(event);
      }
    }, this.delayMs);
  }

  async process(event: T) {
    await this.eventHandler(event);
  }
}
