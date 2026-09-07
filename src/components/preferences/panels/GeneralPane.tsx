import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { MAX_TAB_NUM_LIMIT, useUiStore } from "@/store/ui-store";

export function GeneralPane() {
  const maxTabNum = useUiStore(state => state.maxTabNum);
  const setField = useUiStore(state => state.setField);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>基本設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>最大タブ数</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={1}
              max={MAX_TAB_NUM_LIMIT}
              step={1}
              onChange={e => setField('maxTabNum', Number(e.target.value))}
              value={maxTabNum}
            />
          </InputGroup>
          <FieldDescription>最大 {MAX_TAB_NUM_LIMIT}</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );

}
