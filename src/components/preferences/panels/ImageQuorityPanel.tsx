import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { LinkButton } from '@/components/ui2/LinkButton';
import { usePreferences, useSavePreferences } from '@/services/preferences';
import { openUrl } from '@tauri-apps/plugin-opener';

export function ImageQuorityPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  return (
    <FieldSet className="flex-1">
      <FieldLegend>画質設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>画像拡大縮小時のエッジ強調 (sigma)</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={0}
              max={5}
              step={0.1}
              onChange={e => {
                if (pref) {
                  const newValue = { ...pref };
                  newValue.image_resize_config.unsharp_sigma = Number(e.target.value);
                  savePref.mutate(newValue);
                }
              }}
              value={pref?.image_resize_config.unsharp_sigma ?? ''}
            />
          </InputGroup>
          <FieldDescription>
            増やすと輪郭を強調する(0～5、0にすると無効)
            <br />
            デフォルト {pref?.default?.image_resize_config.unsharp_sigma}
          </FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>画像拡大縮小時のエッジ強調 (threshold)</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={0}
              max={150}
              step={10}
              onChange={e => {
                if (pref) {
                  const newValue = { ...pref };
                  newValue.image_resize_config.unsharp_threshold = Number(e.target.value);
                  savePref.mutate(newValue);
                }
              }}
              value={pref?.image_resize_config.unsharp_threshold ?? ''}
            />
          </InputGroup>
          <FieldDescription>
            減らすと輪郭を強調する(0～150)
            <br />
            デフォルト {pref?.default?.image_resize_config.unsharp_threshold}
            <br />
            参考:
            <LinkButton onClick={() => openUrl('https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%B3%E3%82%B7%E3%83%A3%E3%83%BC%E3%83%97%E3%83%9E%E3%82%B9%E3%82%AF')} label="アンシャープマスク" />
            <LinkButton onClick={() => openUrl('https://docs.rs/image/0.25.10/image/imageops/fn.unsharpen.html')} label="(プログラム)" />
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
