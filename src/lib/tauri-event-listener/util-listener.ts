import { listen as tauri_listen } from '@tauri-apps/api/event';
import { EventAggregator } from './util-aggregator';

export type TauriEventListenerOption = {
  // 新規イベントを無視するための待ち時間
  delayMs?: number | undefined,
};

export class TauriEventListener<T> {
  private eventName: string | null = null;

  private initializing = false;
  private processing: boolean = false;
  private queue: T[] = [];

  private unlistenFn: (() => void) | null = null;

  private eventHandler: ((t: T) => Promise<void>) | null = null;
  private aggregator: EventAggregator<T> | null = null;

  constructor(eventHandler: (t: T) => Promise<void>, option?: TauriEventListenerOption) {
    if (option?.delayMs) {
      this.aggregator = new EventAggregator<T>(option.delayMs, eventHandler);
    } else {
      this.eventHandler = eventHandler;
    }
  }

  async startListen(eventName: string) {
    this.eventName = eventName;

    if (this.initializing || this.unlistenFn) return;
    this.initializing = true;
    console.info(`TauriEventListener(${this.eventName}): startListen()`);

    this.unlistenFn = await tauri_listen<T>(this.eventName, async event => {
      this.queue.push(event.payload);
      this.processQueue();
    });

    this.initializing = false;
  }

  async endListen() {
    if (this.unlistenFn) {
      console.info(`TauriEventListener(${this.eventName}): endListen()`);
      this.unlistenFn();
      this.unlistenFn = null;
    }
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        let log = true;

        if (this.eventHandler) {
          await this.eventHandler(event);
        }
        if (this.aggregator) {
          log = await this.aggregator.emit(event);
        }

        if (log) {
          console.log(`TauriEventListener(${this.eventName}): receive event: `, event);

        }
      }
    }

    this.processing = false;
  }
}
