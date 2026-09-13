import { FallbackProps, getErrorMessage } from 'react-error-boundary';
import { Button } from '../ui/button';

export function ErrorFallback(props: FallbackProps) {
  function handleClickClearConfig() {
    localStorage.clear();
    props.resetErrorBoundary();
    window.location.reload();
  }
  function handleClickRefresh() {
    props.resetErrorBoundary();
    window.location.reload();
  }

  return (
    <div className="p-10">
      <p>ERROR:</p>
      <pre>{getErrorMessage(props.error)}</pre>
      <Button onClick={handleClickClearConfig}>設定リセット</Button>
      <Button onClick={handleClickRefresh}>画面リロード</Button>
    </div>
  );
}
