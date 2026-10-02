import { listen as tauri_listen } from '@tauri-apps/api/event';
import { EventAggregator } from './util-aggregator';

export type TauriEventListenerOption = {
  // キューに同じイベントがあったら、新規イベントを無視する
  ignoreSameEvent?: boolean | undefined,
  delayMs?: number | undefined,
};

export class TauriEventListener<T> {
  private eventName: string | null = null;
  private ignoreSameEvent: boolean;

  private initializing = false;
  private processing: boolean = false;
  private queue: T[] = [];

  private unlistenFn: (() => void) | null = null;
  private eventHandler: (t: T) => Promise<void>;

  constructor(eventHandler: (t: T) => Promise<void>, option?: TauriEventListenerOption) {
    if (option?.delayMs) {
      const aggregator = new EventAggregator<T>(option.delayMs, eventHandler);
      this.eventHandler = aggregator.emit;
    } else {
      this.eventHandler = eventHandler;
    }

    this.ignoreSameEvent = option?.ignoreSameEvent === true;
  }

  async startListen(eventName: string) {
    this.eventName = eventName;

    if (this.initializing || this.unlistenFn) return;
    this.initializing = true;
    console.info(`TauriEventListener(${this.eventName}): startListen()`);

    this.unlistenFn = await tauri_listen<T>(this.eventName, async event => {
      if (this.ignoreSameEvent && this.queue.length !== 0) {
        const last = JSON.stringify(this.queue[this.queue.length - 1]);
        const current = JSON.stringify(event.payload);
        if (last === current) {
          // console.log(`TauriEventListener(${this.eventName}): ignore received event`, event);
          return;
        }
      }

      console.log(`TauriEventListener(${this.eventName}): receive event: `, event);
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
      if (event) await this.eventHandler(event);
    }

    this.processing = false;
  }
}
