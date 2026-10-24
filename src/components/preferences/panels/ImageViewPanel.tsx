import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { useUiStore } from '@/store/ui-store';

export function ImageViewPanel() {
  const hideMouseCursorWhenFullscreen = useUiStore(state => state.hideMouseCursorWhenFullscreen);
  const changeImageViewModeAtChildDirectory = useUiStore(state => state.changeImageViewModeAtChildDirectory);
  const imageViewPageNum = useUiStore(state => state.imageViewPageNum);
  const setField = useUiStore(state => state.setField);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>画像表示画面</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>サムネイルモードで子ディレクトリに入ると、画像表示モードにする</FieldLabel>
          <Switch
            checked={changeImageViewModeAtChildDirectory}
            onCheckedChange={b => setField('changeImageViewModeAtChildDirectory', b)}
          />
          <FieldDescription>
            ディレクトリに入ったとき画像ファイルが選択された状態になっていたら、自動で画像表示モードにします。
          </FieldDescription>
        </Field>

        <Separator />
        <Field>
          <FieldLabel>フルスクリーン時にマウスカーソルを非表示にする</FieldLabel>
          <Switch
            checked={hideMouseCursorWhenFullscreen}
            onCheckedChange={b => setField('hideMouseCursorWhenFullscreen', b)}
          />
        </Field>

        <Separator />
        <Field>
          <FieldLabel><Kbd>PageUp</Kbd>,<Kbd>PageDown</Kbd>時の移動量</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={0}
              max={1000}
              step={1}
              onChange={e => setField('imageViewPageNum', Number(e.target.value))}
              value={imageViewPageNum}
            />
          </InputGroup>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
