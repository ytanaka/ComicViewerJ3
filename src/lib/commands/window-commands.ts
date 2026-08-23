import { getCurrentWindow } from "@tauri-apps/api/window";
import { commands } from "../bindings";

export const windowCommands = {
  async exitApp() {
    const window = getCurrentWindow();
    await window.close();
    await commands.exitApp();
  }
}