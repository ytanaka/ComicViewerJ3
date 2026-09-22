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
          <FieldLabel>古いサムネイルキャッシュファイルを消す期限</FieldLabel>
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
            定期的に各サムネイルファイルを消すかどうかチェックします
            <br />
            0にすると、起動時に全てのサムネイルキャッシュを削除します
            <br />
            デフォルト: {pref?.default?.thumbnail_expiration_days}日
            <br />
            反映するには、再起動してください
          </FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>古い画像表示キャッシュファイルを消す期限</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={1}
              max={10000}
              step={1}
              onChange={e => {
                if (pref) {
                  savePref.mutate({ ...pref, resized_image_expiration_minutes: Number(e.target.value) });
                }
              }}
              value={pref?.resized_image_expiration_minutes ?? ''}
            />
            <InputGroupAddon align="inline-end">(分)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>
            定期的に各画像表示キャッシュファイルを消すかどうかチェックします
            <br />
            デフォルト: {pref?.default?.resized_image_expiration_minutes}分
            <br />
            反映するには、再起動してください
          </FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>サムネイルファイル作成 同時処理数</FieldLabel>
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
          <FieldLabel>画像サイズ変換 同時処理数</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              disabled={!pref}
              type="number"
              min={1}
              max={128}
              step={1}
              onChange={e => {
                if (pref) {
                  savePref.mutate({ ...pref, resize_image_command_limit: Number(e.target.value) });
                }
              }}
              value={pref?.resize_image_command_limit ?? ''}
            />
          </InputGroup>
          <FieldDescription>デフォルトはCPUコア数({pref?.default?.resize_image_command_limit})<br />要再起動</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
