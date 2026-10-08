import { useState } from 'react';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { appCacheDir, appConfigDir, appLogDir } from '@tauri-apps/api/path';

import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/ui-store';
import { LinkButton } from '@/components/ui2/LinkButton';
import { getApplicationName, getApplicationVersion } from '@/components/util/AppInit';
import { FieldSeparator } from '@/components/ui/field';

export function AboutPanel() {
  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);
  const setField = useUiStore(state => state.setField);
  const [clickCount, setClickCount] = useState(0);

  function handleTitleClick() {
    setClickCount(prev => prev + 1);
    if (10 < clickCount && !debugPreferenceOn) {
      setField('debugPreferenceOn', true);
    }
  }
  function handleClick_debugOff() {
    setField('debugPreferenceOn', false);
  }
  function openExplorer(fn: () => Promise<string>) {
    return async () => {
      const dir = await fn();
      console.debug(`revealItemInDir(${dir})`);
      revealItemInDir(dir);
    };
  }

  return (
    <div className="select-none">
      <h1 className='m-2 text-xl' onClick={handleTitleClick}>{getApplicationName()} Ver.{getApplicationVersion()}</h1>
      <FieldSeparator />
      <div className="flex flex-col items-start pt-4 pl-4">
        <LinkButton onClick={openExplorer(appConfigDir)} label="設定ファイル ディレクトリ" title="アプリの設定ファイルがあるディレクトリを開きます" />
        <LinkButton onClick={openExplorer(appCacheDir)} label="キャッシュ ディレクトリ" title="サムネイル画像キャッシュなどがあるディレクトリを開きます" />
        <LinkButton onClick={openExplorer(appLogDir)} label="ログ ディレクトリ" title="アプリのデバッグ用ログファイルがあるディレクトリを開きます" />
      </div>
      <div className="m-2">
        {debugPreferenceOn && <span className="m-3">現在のデバッグ設定: ON</span>}
        {debugPreferenceOn && <Button onClick={handleClick_debugOff}>OFFにする</Button>}
      </div>
    </div>
  );
}
