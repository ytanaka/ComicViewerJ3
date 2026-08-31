import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store"
import { useState } from "react";

export function AboutPane() {
  const debugPreferenceOn = useUiStore(state => state.debugPreferenceOn);
  const setDebugPreferenceOn = useUiStore(state => state.setDebugPreferenceOn);
  const [clickCount, setClickCount] = useState(0)

  function handleTitleClick() {
    setClickCount(prev => prev + 1);
    if (10 < clickCount && !debugPreferenceOn) {
      setDebugPreferenceOn(true);
    }
  }
  function handleClick_debugOff() {
    setDebugPreferenceOn(false);
  }

  return (
    <div>
      <h3 onClick={handleTitleClick}>
        ComicViewerJ3
      </h3>
      <div className="m-2">
        {debugPreferenceOn && <span className="m-3">現在のデバッグ設定: ON</span>}
        {debugPreferenceOn && <Button onClick={handleClick_debugOff}>OFFにする</Button>}
      </div>
    </div>
  )
}