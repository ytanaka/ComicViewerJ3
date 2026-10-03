import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useUiStore } from '@/store/ui-store';
import { ChangeEvent } from 'react';

export function DebugPanel2() {
  const timeoutMsEventTimeStamp = useUiStore(state => state.timeoutMsEventTimeStamp);
  const enableDevTools = useUiStore(state => state.enableDevTools);
  const setField = useUiStore(state => state.setField);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const n = parseInt(e.target.value);
    if (!Number.isNaN(n)) {
      setField('timeoutMsEventTimeStamp', n);
    }
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>デバッグ設定</FieldLegend>
      <FieldGroup>

        <Separator />
        <Field>
          <FieldLabel>イベントハンドラーが古いイベント (e.timeStamp) を受け取ったら無視する閾値</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput type="number" min={0} step={0} onChange={handleChange} value={timeoutMsEventTimeStamp} />
            <InputGroupAddon align="inline-end">(ms)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>0: 時間をチェックしない</FieldDescription>
        </Field>

        <Separator />
        <Field>
          <FieldLabel>DevToolsを有効にする</FieldLabel>
          <Switch
            checked={enableDevTools}
            onCheckedChange={b => setField('enableDevTools', b)}
          />
        </Field>

      </FieldGroup>
    </FieldSet>
  );
}
