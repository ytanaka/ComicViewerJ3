
import { listen as tauri_listen } from '@tauri-apps/api/event';
import { FileNotifyEvent } from './bindings';

const EVENT_ID_FILE_NOTIFY = "file-notify";

// TODO
tauri_listen<FileNotifyEvent>(EVENT_ID_FILE_NOTIFY, (event) => {
  console.log(event);
});
