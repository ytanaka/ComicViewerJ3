import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/services/preferences';

export function ImageQuorityPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  return (
    <FieldSet className="flex-1">
      <FieldLegend>画質設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>画像拡大縮小時のエッジ強調</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={0}
              max={10}
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
            TODO
            <br />
            デフォルト {pref?.default?.image_resize_config.unsharp_sigma}
          </FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>画像拡大縮小時のエッジ強調2</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={0}
              max={10}
              step={0.1}
              onChange={e => {
                if (pref) {
                  const newValue = { ...pref };
                  newValue.image_resize_config.unsharp_amount = Number(e.target.value);
                  savePref.mutate(newValue);
                }
              }}
              value={pref?.image_resize_config.unsharp_amount ?? ''}
            />
          </InputGroup>
          <FieldDescription>
            TODO
            <br />
            デフォルト {pref?.default?.image_resize_config.unsharp_amount}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
