import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { useUiStore } from '@/store/ui-store';

export function ImageViewPanel() {
  const hideMouseCursorWhenFullscreen = useUiStore(state => state.hideMouseCursorWhenFullscreen);
  const setField = useUiStore(state => state.setField);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>画像表示画面</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>フルスクリーン時にマウスカーソルを非表示にする</FieldLabel>
          <Switch
            checked={hideMouseCursorWhenFullscreen}
            onCheckedChange={(b) => setField('hideMouseCursorWhenFullscreen', b)}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
