import { THUMBNAIL_SIZE_LIST } from '@/components/tab/thumbnail-view/Thumbnails';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUiStore } from '@/store/ui-store';

export function ThumbnailPanel() {
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
      </FieldGroup>
    </FieldSet>
  );
}
