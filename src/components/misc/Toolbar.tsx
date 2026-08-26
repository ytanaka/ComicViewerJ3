import { ReactNode } from 'react';
import {
  LogOut,
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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { windowCommands } from '@/lib/commands/window-commands';

function B({ icon, onClick, toolTip }: { icon: ReactNode, onClick?: () => void, toolTip?: string }) {
  const baseComponent = (
    <Button variant="outline" size="sm" onClick={onClick}>
      {icon}
    </Button>
  );

  if (toolTip) {
    return (
      <Tooltip>
        <TooltipTrigger render={baseComponent} />
        <TooltipContent side='top'>
          <p>{toolTip}</p>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return baseComponent;
  }
}

export function Toolbar() {
  return (
    <div className="flex items-center gap-0.5 border rounded-md p-0.5">
      <B icon={<FolderOpen />} toolTip='ディレクトリを開く' onClick={windowCommands.openDirectory} />
      <B icon={<LogOut />} toolTip='アプリ終了' onClick={windowCommands.exitApp} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Scissors />} />
      <B icon={<Copy />} />
      <B icon={<ClipboardPaste />} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Trash2 />} />
      <B icon={<TextCursorInput />} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<Rows3 />} />
      <B icon={<Grid2x2 />} />
      <Separator orientation="vertical" className="m-1" />

      <B icon={<><Sun /><Moon /></>} />
      <B icon={<Fullscreen />} />
    </div>
  );
}
