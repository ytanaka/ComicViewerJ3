import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { usePreferences, useSavePreferences } from '@/services/preferences';
import { useUiStore } from '@/store/ui-store';

export function AdvancedPanel() {
  const fileSearchInputTimeoutMs = useUiStore(state => state.fileSearchInputTimeoutMs);
  const fileSearchResultDisplayTimeoutMs = useUiStore(state => state.fileSearchResultDisplayTimeoutMs);
  const setField = useUiStore(state => state.setField);

  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  return (
    <FieldSet className="flex-1">
      <FieldLegend>高度な設定</FieldLegend>
      <FieldGroup>
        <Separator />
        <Field>
          <FieldLabel>ファイル検索のローマ字入力のタイムアウト</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={1000}
              max={10000}
              step={250}
              onChange={e => setField('fileSearchInputTimeoutMs', Number(e.target.value))}
              value={fileSearchInputTimeoutMs}
            />
            <InputGroupAddon align="inline-end">(ミリ秒)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>この時間キーボード入力が途絶えると、次の入力は別の単語として認識されます</FieldDescription>
        </Field>
        <Separator />
        <Field>
          <FieldLabel>ファイル検索結果のツールチップを消す時間</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={1000}
              max={10000}
              step={250}
              onChange={e => setField('fileSearchResultDisplayTimeoutMs', Number(e.target.value))}
              value={fileSearchResultDisplayTimeoutMs}
            />
            <InputGroupAddon align="inline-end">(ミリ秒)</InputGroupAddon>
          </InputGroup>
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
              onChange={(e) => { if (pref) { savePref.mutate({ ...pref, thumbnail_expiration_hours: Number(e.target.value) }); } }}
              value={pref?.thumbnail_expiration_hours ?? ""}
            />
            <InputGroupAddon align="inline-end">(時間)</InputGroupAddon>
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
              onChange={(e) => { if (pref) { savePref.mutate({ ...pref, thumbnail_command_limit: Number(e.target.value) }); } }}
              value={pref?.thumbnail_command_limit ?? ""}
            />
          </InputGroup>
          <FieldDescription>
            デフォルトはCPUコア数
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
