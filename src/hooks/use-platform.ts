import { platform, type Platform } from '@tauri-apps/plugin-os'

export type AppPlatform = 'macos' | 'windows' | 'linux'

let cachedPlatform: AppPlatform | null = null

function mapPlatform(p: Platform): AppPlatform {
  if (p === 'macos') return 'macos';
  if (p === 'windows') return 'windows';
  return 'linux';
}

function initPlatform(): AppPlatform {
  if (cachedPlatform === null) {
    try {
      cachedPlatform = mapPlatform(platform())
    } catch (e) {
      console.error('Platform detection failed, defaulting to windows', e);
      cachedPlatform = 'windows';
    }
  }
  return cachedPlatform;
}

export function getPlatform(): AppPlatform {
  return initPlatform()
}
