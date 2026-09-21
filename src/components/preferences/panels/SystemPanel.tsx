import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/services/preferences';

export function SystemPanel() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  return (
    <FieldSet className="flex-1">
      <FieldLegend>システム設定</FieldLegend>
      <FieldGroup>
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
          <FieldDescription>デフォルトはCPUコア数({pref?.default?.thumbnail_command_limit})</FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>画像サイズ変換同時処理数</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={1}
              max={128}
              step={1}
              onChange={e => {
                if (pref) {
                  savePref.mutate({ ...pref, resize_img_command_limit: Number(e.target.value) });
                }
              }}
              value={pref?.resize_img_command_limit ?? ''}
            />
          </InputGroup>
          <FieldDescription>デフォルトはCPUコア数({pref?.default?.resize_img_command_limit})</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
