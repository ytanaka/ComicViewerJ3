import { useUiStore } from "@/store/ui-store"
import { useEffect } from "react"

export function DisableTauriShortcut() {
  const enableDevTools = useUiStore(state => state.enableDevTools);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const devtoolsShortcut =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i")

      if (!enableDevTools && devtoolsShortcut) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [enableDevTools])

  return <></>
}
