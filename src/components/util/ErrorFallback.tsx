import { FallbackProps, getErrorMessage } from "react-error-boundary";
import { Button } from "../ui/button";

export function ErrorFallback(props: FallbackProps) {
  function handleClick() {
    localStorage.clear();
    props.resetErrorBoundary();
    window.location.reload();
  }

  return (
    <div className="p-10">
      <p>ERROR:</p>
      <pre>{getErrorMessage(props.error)}</pre>
      <Button onClick={handleClick}>リセット</Button>
    </div>
  );
}
