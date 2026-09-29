import { listen as tauri_listen } from '@tauri-apps/api/event';

export class TauriEventListener<T> {
  private eventName: string | null = null;;

  private initializing = false;
  private processing: boolean = false;
  private queue: T[] = [];

  private unlistenFn: (() => void) | null = null;
  private eventHandler: (t: T) => Promise<void>

  constructor(eventHandler: (t: T) => Promise<void>) {
    this.eventHandler = eventHandler;
  }

  async startListen(eventName: string) {
    this.eventName = eventName;

    if (this.initializing || this.unlistenFn) return;
    this.initializing = true;
    console.info(`TauriEventListener(${this.eventName}): startListen()`);

    this.unlistenFn = await tauri_listen<T>(this.eventName, async event => {
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
