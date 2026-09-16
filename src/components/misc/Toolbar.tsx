import { ReactNode } from 'react';
import {
  Fullscreen,
  Moon,
  Sun,
  FolderOpen,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  TextCursorInput,
  Grid2x2,
  Rows3,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AppMenuItem, menuItems } from '@/lib/menu-items';
import { useTabStore } from '@/store/tab/store';
import { useFocusStore } from '@/store/focus-store';

function B({ icon, m }: { icon: ReactNode; m: AppMenuItem }) {
  const setFocus = useFocusStore(state => state.setFocus);
  const enabled = m.checkEnabledFn === undefined || m.checkEnabledFn();

  const baseComponent = (
    <Button
      disabled={!enabled}
      variant="outline"
      size="sm"
      onClick={() => {
        if (m.exec) m.exec();
        setFocus();
      }}
    >
      {icon}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={baseComponent} />
      <TooltipContent side="top">
        <p>{m.value}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  // タブ状態やファイル選択状態が変わったら再描画させる
  useTabStore(state => state.getCurrentTab());
  useTabStore(state => state.getCurrentTab()?.selection);

  return (
    <div className="flex items-center gap-0.5 border rounded-md p-0.5">
      <B icon={<FolderOpen />} m={menuItems.openDir} />
      <B icon={<Settings />} m={menuItems.preference} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Scissors />} m={menuItems.cutFile} />
      <B icon={<Copy />} m={menuItems.copyFile} />
      <B icon={<ClipboardPaste />} m={menuItems.pasteFile} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Trash2 />} m={menuItems.deleteFile} />
      <B icon={<TextCursorInput />} m={menuItems.renameFile} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Rows3 />} m={menuItems.changeToListViewMode} />
      <B icon={<Grid2x2 />} m={menuItems.changeToThumbnailViewMode} />
      <Separator orientation="vertical" className="m-1" />

      <B
        icon={
          <>
            <Sun />
            <Moon />
          </>
        }
        m={menuItems.toggleTheme}
      />
      <B icon={<Fullscreen />} m={menuItems.changeFullscreen} />
    </div>
  );
}
