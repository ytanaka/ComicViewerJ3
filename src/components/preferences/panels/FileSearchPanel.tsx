import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { useUiStore } from '@/store/ui-store';

export function FileSearchPanel() {
  const fileSearchInputTimeoutMs = useUiStore(state => state.fileSearchInputTimeoutMs);
  const fileSearchResultDisplayTimeoutMs = useUiStore(state => state.fileSearchResultDisplayTimeoutMs);
  const setField = useUiStore(state => state.setField);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>ファイル検索設定</FieldLegend>
      <FieldDescription>
        ファイル一覧が表示されている画面でローマ字入力すると、ファイル名検索をすることができます。
        <br />
        (IMEをOFFにしてアルファベットや数字を入力してください)
        <br />
        検索に成功した後、続けて次のファイルを検索するときは&quot;Ctrl+N&quot;を押してください。(前のファイルを検索するときは&quot;Ctrl+P&quot;)
      </FieldDescription>
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
          <FieldDescription>
            この時間キーボード入力が途絶えると、次の入力は別の単語として認識されます
            <br />
            ゆっくり入力したいときは長くしてください
            <br />
            入力途中で中断して次の検索をしたいときは&quot;ESC&quot;キーを押してください
          </FieldDescription>
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
          <FieldDescription>
            ローマ字入力してファイルが見つかると、結果をツールチップで表示します。
            <br />
            ゆっくり確認したいときは長くしてください。
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
