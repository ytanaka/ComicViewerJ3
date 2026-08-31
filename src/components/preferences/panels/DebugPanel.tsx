import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { usePreferences, useSavePreferences } from "@/hooks/preferences";
import { ChangeEvent } from "react";

export function DebugPane() {
  const { data: pref } = usePreferences();
  const savePref = useSavePreferences();

  function handleChange_debug_filename_search_sleep_ms(e: ChangeEvent<HTMLInputElement>) {
    const n = Number(e.target.value);
    if (pref) {
      savePref.mutate({ ...pref, debug_filename_search_sleep_ms: n })
    }
  }

  return (
    <FieldSet className="flex-1">
      <FieldLegend>デバッグ設定</FieldLegend>
      <FieldDescription>※ 触らないこと</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel>ファイルサーチ時に100ファイル確認ごとにスリープを入れる</FieldLabel>
          <InputGroup className="max-w-40">
            <InputGroupInput
              type="number"
              min={0}
              max={100}
              step={10}
              onChange={handleChange_debug_filename_search_sleep_ms}
              value={pref?.debug_filename_search_sleep_ms ?? 0}
            />
            <InputGroupAddon align='inline-end'>(ms)</InputGroupAddon>
          </InputGroup>
          <FieldDescription>0: 無効</FieldDescription>
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}