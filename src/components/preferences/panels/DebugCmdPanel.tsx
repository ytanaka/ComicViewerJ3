import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { handleRustCmdResult, rustcmds } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { mkUiTab } from '@/store/tab/types';
import { useUiVolatileStore } from '@/store/ui-volatile-store';

export function DebugCmdPane() {
  const [newTabPath, setNewTabPath] = useState('');

  async function handleClickCreateTab() {
    const result = await rustcmds.createTab(newTabPath);
    handleRustCmdResult(result, `rustcmds.createTab for DEBUG`, "タブ作成失敗", (data) => {
      toast(`OK: id=${data.id}, path=${data.path}`, { duration: 5000 });
      useTabStore.getState().addTab(mkUiTab(data));
      useUiVolatileStore.getState().setShowPreferencesDialog(false);
    })
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>デバッグAPI実行</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>任意のパスでタブを開く</FieldLabel>
          <div className="flex">
            <InputGroup className="max-w-40">
              <InputGroupInput
                value={newTabPath}
                onKeyDown={e => {
                  if (e.code === 'Enter') handleClickCreateTab();
                }}
                onChange={e => setNewTabPath(e.target.value)}
              />
            </InputGroup>
            <Button className="ml-3" onClick={handleClickCreateTab}>
              開く
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
