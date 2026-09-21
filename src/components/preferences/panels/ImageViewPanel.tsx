import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { usePreferences, useSavePreferences } from '@/services/preferences';

import { useUiStore } from '@/store/ui-store';

export function ImageViewPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  const hideMouseCursorWhenFullscreen = useUiStore(state => state.hideMouseCursorWhenFullscreen);
  const imageRendering = useUiStore(state => state.imageRendering);
  const setField = useUiStore(state => state.setField);

  const imageRenderingList = ['auto', 'smooth', 'crisp-edges', 'pixelated'];

  return (
    <FieldSet className="flex-1">
      <FieldLegend>画像表示画面</FieldLegend>
      <FieldGroup>
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
          <FieldLabel>画像表示時の拡大縮小アルゴリズム</FieldLabel>
          <Select
            value={imageRendering}
            onValueChange={v => {
              if (v) setField('imageRendering', v);
            }}
          >
            <SelectTrigger className="w-full max-w-48">
              <SelectValue>{imageRendering}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {imageRenderingList.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription>
            auto: 自動 (smoothと同じ)
            <br />
            smooth: 画像を滑らかに補間して拡大縮小します。自然画や写真向き
            <br />
            crisp-edges: 画像のコントラストとエッジを保つように拡大縮小
            <br />
            pixelated: 拡大時は crisp-edge、縮小時は auto
          </FieldDescription>
          <FieldDescription>※ CSS の image-rendering に指定する値です</FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>画像拡大縮小時の</FieldLabel>
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
          </InputGroup>
          <FieldDescription>
            3時間おきに各サムネイルファイルを消すかどうかチェックします
            <br />
            0にすると、起動時に全てのサムネイルキャッシュを削除します
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
