import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Fullscreen, Moon, Sun, FolderOpen, Scissors, Copy, ClipboardPaste, Trash2, TextCursorInput, Grid2x2, Rows3 } from 'lucide-react';
import { Toggle } from './ui/toggle';

export function Toolbar() {
  return (
    <div className="flex items-center gap-0.5 border rounded-md p-0.5">
      <Button variant="outline" size="sm">
        <FolderOpen />
      </Button>

      <Button variant="outline" size="sm">
        <LogOut />
      </Button>

      <Separator orientation="vertical" className='m-1' />

      <Button variant="outline" size="sm">
        <Scissors />
      </Button>
      <Button variant="outline" size="sm">
        <Copy />
      </Button>
      <Button variant="outline" size="sm">
        <ClipboardPaste />
      </Button>

      <Separator orientation="vertical" className='m-1' />

      <Button variant="outline" size="sm">
        <Trash2 />
      </Button>
      <Button variant="outline" size="sm">
        <TextCursorInput />
      </Button>

      <Separator orientation="vertical" className='m-1' />

      <Toggle variant='outline' size="sm">
        <Rows3 />
      </Toggle>
      <Toggle variant='outline' size="sm">
        <Grid2x2 />
      </Toggle>

      <Separator orientation="vertical" className='m-1' />

      <Button variant="outline" size="sm">
        <Sun />
        <Moon />
      </Button>

      <Button variant="outline" size="sm">
        <Fullscreen />
      </Button>
    </div>
  );
}
