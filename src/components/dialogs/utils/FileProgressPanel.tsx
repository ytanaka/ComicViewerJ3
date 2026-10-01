import { TaskEventFileProgress, TaskEventHeader } from '@/lib/bindings';
import { formatFileBytes } from '@/lib/tools/string-util';

export function FileProgressPanel({
  header,
  progress,
}: {
  header: TaskEventHeader | undefined;
  progress: TaskEventFileProgress | undefined;
}) {
  const size = progress?.size;
  const files = progress?.files;
  const dirs = progress?.dires;
  const symlinks = progress?.symlinks;

  return (
    <>
      {size !== undefined && (
        <>
          サイズ: {formatFileBytes(size)} ({size.toLocaleString()} バイト)
        </>
      )}
      {!!files && (
        <>
          <br />
          ファイル数: {files.toLocaleString()}
        </>
      )}
      {!!dirs && (
        <>
          <br />
          ディレクトリ数: {dirs.toLocaleString()}
        </>
      )}
      {!!symlinks && (
        <>
          <br />
          リンク数: {symlinks.toLocaleString()}
        </>
      )}
      {header?.error_msg && (
        <>
          <br />
          <br />
          {header.error_msg}
        </>
      )}
    </>
  );
}
