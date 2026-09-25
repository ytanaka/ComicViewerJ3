import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';

import { Separator } from '@/components/ui/separator';
import { DEFAULT_INVOKE_EXT_LIST, useUiStore } from '@/store/ui-store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function InvokeAppPanel() {
  const invokeByOsExt = useUiStore(state => state.invokeByOsExt);
  const setField = useUiStore(state => state.setField);

  const [extStr, setExtStr] = useState<string>(invokeByOsExt.join(' '));

  function handleClickSave() {
    const list = extStr
      .replace(/[^ -~]+/g, ' ')
      .trim()
      .toLowerCase()
      .split(/\s+/);
    setField('invokeByOsExt', list);
  }
  function handleClickDefault() {
    setExtStr(DEFAULT_INVOKE_EXT_LIST.join(' '));
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>アプリ起動</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>起動可能なファイル拡張子</FieldLabel>
          <Textarea onChange={e => setExtStr(e.target.value)} value={extStr} />
        </Field>
        <div className="flex m-0 p-0">
          <Button className="w-fit ml-2" onClick={handleClickSave}>
            保存
          </Button>
          <Button className="w-fit ml-2" onClick={handleClickDefault}>
            デフォルト
          </Button>
        </div>
        <FieldDescription className="m-0 p-0">
          拡張子をスペース区切りで指定する。
          <br />
          ここで指定した拡張子のファイルをダブルクリックすると、OSに関連付けられたアプリが起動する。
          <br />
          画像ファイルの拡張子を指定すれば、アプリの内蔵ビューアーでなくOSに関連付けられたビューアーが起動する。
        </FieldDescription>
      </FieldGroup>
    </FieldSet>
  );
}
