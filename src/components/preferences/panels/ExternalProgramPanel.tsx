import { MouseEventHandler, ReactNode } from 'react';

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import { ExternalProgram, getExternalProgramExamples, useExternalProgramStore } from '@/store/external-program-store';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Kbd } from '@/components/ui/kbd';

export function ExternalProgramPanel() {
  const list = useExternalProgramStore(state => state.list);
  const remove = useExternalProgramStore(state => state.remove);
  const swap = useExternalProgramStore(state => state.swap);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>外部アプリ起動</FieldLegend>
      <FieldGroup>
        <div className="flex m-0">
          <AddButton />
        </div>
        <div className="flex flex-col overflow-auto m-0">
          {list.map((p, i) => {
            return (
              <div key={i} className="flex">
                <div className='pr-2'>{i}: </div>
                <EditButton index={i} program={p} />
                <B click={() => remove(i)}>削除</B>
                <B click={() => swap(i, i - 1)}>↑</B>
                <B click={() => swap(i, i + 1)}>↓</B>
                <div className='pl-2'>{p.name}</div>
              </div>
            );
          })}
        </div>
        <FieldDescription>
          ショートカットキー<Kbd>Ctrl+0</Kbd>～<Kbd>Ctrl+9</Kbd>で起動
        </FieldDescription>
        <Separator />
      </FieldGroup>
    </FieldSet>
  );
}

function AddButton() {
  const add = useExternalProgramStore(state => state.add);
  const list = getExternalProgramExamples();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button>追加</Button>} />
      <DropdownMenuContent className='min-w-max'>
        {list.map((p, i) => (
          <DropdownMenuItem key={i} onClick={() => add(p)}>
            {p.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EditButton({ index, program }: { index: number; program: ExternalProgram }) {
  const update = useExternalProgramStore(state => state.update);
  function upd<K extends keyof ExternalProgram>(key: K, value: ExternalProgram[K]) {
    const p = { ...program };
    p[key] = value;
    if (typeof value === 'number' && isNaN(value)) return;
    update(index, p);
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button size="xs">編集</Button>} />
      <PopoverContent className="min-w-max p-3">
        <div className="flex flex-col">
          <div className="flex items-center m-1">
            <label>名前</label>
            <Input className="flex-1 ml-2" value={program.name} onChange={e => upd('name', e.target.value)}></Input>
          </div>

          <div className="flex m-1">
            <div>起動前に確認する</div>
            <Switch className="ml-2" checked={program.debugPrompt} onCheckedChange={e => upd('debugPrompt', e)} />
          </div>

          <div className="flex items-center m-1">
            <div>選択ファイル数制限</div>
            <Input
              type="number"
              className="max-w-20 ml-2 mr-2"
              min={0}
              value={program.maxSelectionLimit}
              onChange={e => upd('maxSelectionLimit', Number(e.target.value))}
            />
            <div className="opacity-65">(0は制限なし)</div>
          </div>

          <div className="m-1">
            <Textarea value={program.command} onChange={e => upd('command', e.target.value)} />
          </div>
        </div>

        <FieldDescription>
          プログラム引数の <code>{'${files}'}</code> は選択ファイルに置き換え
          <br />
          プログラム引数の <code>{'${dir}'}</code> は現在のタブのディレクトリに置き換え
          <br />
        </FieldDescription>
      </PopoverContent>
    </Popover>
  );
}

function B({ click, children }: { click?: MouseEventHandler | undefined; children: ReactNode }) {
  return (
    <Button size="xs" variant="secondary" onClick={click}>
      {children}
    </Button>
  );
}
