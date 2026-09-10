import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/hooks/preferences';
import { FilenameCmpType_type } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';

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

  return (
    <FieldSet className="flex-1">
      <FieldLegend>ファイル一覧表示設定</FieldLegend>
      <FieldGroup>
        <Separator />

        <Field>
          <FieldLabel>ファイル名のソート方法</FieldLabel>
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
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
