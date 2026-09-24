import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { usePreferences, useSavePreferences } from '@/services/preferences';
import { FilenameCmpType_type } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { Switch } from '@/components/ui/switch';

const filenameCmpItems: FilenameCmpType_type[] = ['Icu', 'Sjis', 'Unicode'];

export function FileListPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  function handleChange_filename_cmp(value: FilenameCmpType_type | null) {
    if (pref && value) {
      savePref.mutate(
        { ...pref, filename_cmp: { type: value } },
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
  function handleChange_filename_cmp_digit(value: boolean) {
    if (pref) {
      savePref.mutate(
        { ...pref, filename_cmp_by_digit: value },
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

  return (
    <FieldSet className="flex-1">
      <FieldLegend>ファイル一覧表示設定</FieldLegend>
      <FieldGroup>
        <Separator />

        <Field>
          <FieldLabel>ファイル名の並び順</FieldLabel>
          <Select value={pref?.filename_cmp.type ?? 'Icu'} onValueChange={handleChange_filename_cmp}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue>{pref?.filename_cmp.type}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filenameCmpItems.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            Icu: 自然な並び
            <br />
            Sjis: シフトJISで比較
            <br />
            Unicode: ユニコードの文字コードで比較
          </FieldDescription>
          <FieldDescription>ソート時間: (速い) Unicode &lt; Sjis &lt; Icu (遅い)</FieldDescription>
        </Field>
        <FieldSeparator />
        <Field>
          <FieldLabel>ファイル名の数字の大小で並べる</FieldLabel>
          <Switch checked={pref?.filename_cmp_by_digit ?? false} onCheckedChange={handleChange_filename_cmp_digit} />
        </Field>
        <FieldDescription>img_1.txt → img_2.txt → img_10.txt のように並べる</FieldDescription>
      </FieldGroup>
    </FieldSet>
  );
}
