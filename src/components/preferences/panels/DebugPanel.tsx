import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/services/preferences';
import { ChangeEvent } from 'react';
import { useTabStore } from '@/store/tab/store';

const sortStrengthItems = [
  { label: 'あいまい', value: 'Primary' },
  { label: '少しあいまい', value: 'Secondary' },
  { label: 'ほどほど', value: 'Tertiary' },
  { label: '少し厳密', value: 'Quaternary' },
  { label: '厳密', value: 'Identical' },
];

export function DebugPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  function handleChange_debug_filename_search_sleep_ms(e: ChangeEvent<HTMLInputElement>) {
    const n = Number(e.target.value);
    if (pref) {
      savePref.mutate({ ...pref, debug_filename_search_sleep_ms: n });
    }
  }

  function handleChange_filename_sort_strength(value: string | null) {
    if (pref && value) {
      savePref.mutate(
        { ...pref, filename_sort_strength: value },
        {
          onSuccess: () => {
            // タブ再読み込み
            useTabStore.getState().tabs.forEach(t => {
              useTabStore.getState().incRefreshCount(t.info.id);
            });
          },
        }
      );
    }
  }
  function getLabel(value: string | undefined) {
    const item = sortStrengthItems.find(item => item.value === value);
    return item?.label ?? '選択してください';
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>デバッグ設定</FieldLegend>
      <FieldGroup>
        <Separator />

        <Field>
          <FieldLabel>ファイルサーチ時に100ファイル確認ごとにRust側でスリープを入れる</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={0}
              max={100}
              step={10}
              onChange={handleChange_debug_filename_search_sleep_ms}
              value={pref?.debug_filename_search_sleep_ms ?? 0}
            />
            <InputGroupAddon align="inline-end">(ms)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>0: 無効</FieldDescription>
        </Field>

        <Separator />

        <Field>
          <FieldLabel>ソート順</FieldLabel>
          <Select
            value={pref?.filename_sort_strength ?? 'Identical'}
            onValueChange={handleChange_filename_sort_strength}
          >
            <SelectTrigger className="w-full max-w-48">
              <SelectValue>{getLabel(pref?.filename_sort_strength)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortStrengthItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>日本語ファイル名のひらがな、カタカナ、全角半角などの比較方法</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
