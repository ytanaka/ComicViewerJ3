
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExternalProgram, mkExternalProgram, useExternalProgramStore } from '@/store/external-program-store';
import { MouseEventHandler, ReactNode } from 'react';

export function ExternalProgramPanel() {
  const list = useExternalProgramStore(state => state.list);
  const add = useExternalProgramStore(state => state.add);
  const remove = useExternalProgramStore(state => state.remove);
  const swap = useExternalProgramStore(state => state.swap);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>外部アプリ起動</FieldLegend>
      <FieldGroup>
        <div className='flex m-0'>
          <Button onClick={() => add(mkExternalProgram())}>追加</Button>
        </div>
        <div className="flex flex-col overflow-auto m-0">
          {list.map((p, i) => {
            return (
              <div key={i} className='flex'>
                <div>{i}: </div>
                <EditButton index={i} program={p} />
                <B click={() => remove(i)} >削除</B>
                <B click={() => swap(i, i - 1)} >↑</B>
                <B click={() => swap(i, i + 1)} >↓</B>
                <div>{p.name}</div>
              </div>
            );
          })}
        </div>
        <Separator />
      </FieldGroup>
    </FieldSet>
  );
}

function EditButton({ index, program }: { index: number, program: ExternalProgram }) {
  const update = useExternalProgramStore(state => state.update);
  function x<K extends keyof ExternalProgram>(key: K, value: ExternalProgram[K]) {
    const p = { ...program };
    p[key] = value;
    update(index, p);
  }

  return (
    <Popover>
      <PopoverTrigger render={<B>編集</B>} />
      <PopoverContent>
        <div className='flex flex-col'>
          <div>
            <label>名前</label>
            <Input value={program.name} onChange={(e) => x('name', e.target.value)}></Input>
          </div>
          <div>
            <Textarea value={program.command} onChange={(e) => x('command', e.target.value)} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function B({ click, children }: { click?: MouseEventHandler | undefined, children: ReactNode }) {
  return (
    <Button size='sm' variant='secondary' onClick={click} >{children}</Button>
  );
}