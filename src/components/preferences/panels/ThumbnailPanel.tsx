import { THUMBNAIL_SIZE_LIST } from '@/components/tab/thumbnail-view/Thumbnails';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/services/preferences';
import { useUiStore } from '@/store/ui-store';

export function ThumbnailPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  const defaultThumbnailSize = useUiStore(state => state.defaultThumbnailSize);
  const setField = useUiStore(state => state.setField);

  function handleChange_defaultThumbnailSize(value: number | null) {
    if (value === null) return;
    setField('defaultThumbnailSize', value);
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>サムネイル設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>サムネイルのデフォルトサイズ</FieldLabel>
          <Select value={defaultThumbnailSize} onValueChange={handleChange_defaultThumbnailSize}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue>{defaultThumbnailSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {THUMBNAIL_SIZE_LIST.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>画像の古いサムネイルキャッシュを消す期限</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={0}
              max={10000}
              step={1}
              onChange={e => {
                if (pref) {
                  savePref.mutate({ ...pref, thumbnail_expiration_days: Number(e.target.value) });
                }
              }}
              value={pref?.thumbnail_expiration_days ?? ''}
            />
            <InputGroupAddon align="inline-end">(日)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            3時間おきに各サムネイルファイルを消すかどうかチェックします
            <br />
            0にすると、起動時に全てのサムネイルキャッシュを削除します
          </FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>サムネイルファイル同時処理数</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={1}
              max={128}
              step={1}
              onChange={e => {
                if (pref) {
                  savePref.mutate({ ...pref, thumbnail_command_limit: Number(e.target.value) });
                }
              }}
              value={pref?.thumbnail_command_limit ?? ''}
            />
          </InputGroup>
          <FieldDescription>デフォルトはCPUコア数</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
