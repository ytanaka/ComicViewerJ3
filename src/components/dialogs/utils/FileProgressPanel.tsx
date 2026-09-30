import { TaskEventFileProgress, TaskEventHeader } from "@/lib/bindings";
import { formatFileBytes } from "@/lib/tools/string-util";

export function FileProgressPanel({ header, progress }: { header: TaskEventHeader | undefined, progress: TaskEventFileProgress | undefined }) {
  return (
    <>
      サイズ: {formatFileBytes(progress?.size ?? 0)} ({progress?.size.toLocaleString()} バイト)
      <br />
      ファイル数: {progress?.files.toLocaleString()}
      <br />
      ディレクトリ数: {progress?.dires.toLocaleString()}
      {progress?.symlinks !== 0 && (
        <>
          <br />
          リンク数: {progress?.symlinks.toLocaleString()}
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