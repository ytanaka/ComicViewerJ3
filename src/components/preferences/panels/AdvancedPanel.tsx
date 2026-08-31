import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useUiStore } from "@/store/ui-store";

export function AdvancedPane() {
  const fileSearchInputTimeoutMs = useUiStore(state => state.fileSearchInputTimeoutMs);
  const setFileSearchInputTimeoutMs = useUiStore(state => state.setFileSearchInputTimeoutMs);

  const fileSearchResultDisplayTimeoutMs = useUiStore(state => state.fileSearchResultDisplayTimeoutMs);
  const setFileSearchResultDisplayTimeoutMs = useUiStore(state => state.setFileSearchResultDisplayTimeoutMs);

  return (
    <FieldSet className="flex-1">
      <FieldLegend>高度な設定</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel>ファイル検索のローマ字入力のタイムアウト</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={1000}
              max={10000}
              step={250}
              onChange={(e) => setFileSearchInputTimeoutMs(Number(e.target.value))}
              value={fileSearchInputTimeoutMs}
            />
            <InputGroupAddon align='inline-end'>(ms)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>この時間キーボード入力が途絶えると、次の入力は別の単語として認識されます</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>ファイル検索結果をツールチップで表示するタイムアウト</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={1000}
              max={10000}
              step={250}
              onChange={(e) => setFileSearchResultDisplayTimeoutMs(Number(e.target.value))}
              value={fileSearchResultDisplayTimeoutMs}
            />
            <InputGroupAddon align='inline-end'>(ms)</InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}