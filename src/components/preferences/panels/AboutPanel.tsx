import { useState } from 'react';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { appCacheDir, appConfigDir, appDataDir, appLogDir } from '@tauri-apps/api/path';

import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';

export function AboutPane() {
  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);
  const setDebugPreferenceOn = useUiStore(state => state.setDebugPreferenceOn);
  const [clickCount, setClickCount] = useState(0);

  function handleTitleClick() {
    setClickCount(prev => prev + 1);
    if (10 < clickCount && !debugPreferenceOn) {
      setDebugPreferenceOn(true);
    }
  }
  function handleClick_debugOff() {
    setDebugPreferenceOn(false);
  }
  function openExplorer(fn: () => Promise<string>) {
    return async () => {
      const dir = await fn();
      revealItemInDir(dir);
    }
  }

  return (
    <div className='select-none'>
      <h3 onClick={handleTitleClick}>ComicViewerJ3</h3>
      <div className='flex flex-col items-start pt-4 pl-4'>
        <LinkButton onClick={openExplorer(appConfigDir)} label='アプリの設定ファイル ディレクトリ' />
        <LinkButton onClick={openExplorer(appDataDir)} label='アプリのデータ ディレクトリ' />
        <LinkButton onClick={openExplorer(appCacheDir)} label='アプリのキャッシュ ディレクトリ' />
        <LinkButton onClick={openExplorer(appLogDir)} label='アプリのログ ディレクトリ' />
      </div>
      <div className="m-2">
        {debugPreferenceOn && <span className="m-3">現在のデバッグ設定: ON</span>}
        {debugPreferenceOn && <Button onClick={handleClick_debugOff}>OFFにする</Button>}
      </div>
    </div>
  );
}

function LinkButton({ label, onClick }: { label: string, onClick: () => Promise<void> }) {
  return <Button size='sm' className='font-light' variant="link" onClick={onClick}>{label}</Button>
}