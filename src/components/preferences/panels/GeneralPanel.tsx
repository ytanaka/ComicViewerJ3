import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { FONT_FAMILY_LIST, MAX_TAB_NUM_LIMIT, useUiStore } from '@/store/ui-store';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export function GeneralPanel() {
  const maxTabNum = useUiStore(state => state.maxTabNum);
  const fontFamily = useUiStore(state => state.fontFamily);
  const fontSize = useUiStore(state => state.fontSize);
  const setField = useUiStore(state => state.setField);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>基本設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>フォント</FieldLabel>
          <NativeSelect className='max-w-40' value={fontFamily} onChange={(e) => { setField('fontFamily', e.target.value) }}>
            {FONT_FAMILY_LIST.map(item => (
              <NativeSelectOption key={item} value={item}>
                {item}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <div className='flex items-center'>
            <InputGroup className="max-w-40">
              <InputGroupInput
                type="number"
                min={0}
                max={100}
                step={1}
                onChange={e => setField('fontSize', Number(e.target.value))}
                value={fontSize}
              />
            </InputGroup>
            <FieldDescription className='pl-2'>0: デフォルト</FieldDescription>
          </div>
          <div className='border w-fit' style={{ fontFamily: fontFamily, fontSize: 0 < fontSize ? fontSize : undefined }}>
            フォントの表示例です。<br />
            あいうえおABC123.456.789 漢字テスト「日本語Font Sample」
          </div>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>タブ数制限</FieldLabel>
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
    </FieldSet >
  );
}
