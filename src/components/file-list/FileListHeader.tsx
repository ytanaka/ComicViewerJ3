import { useUiStore } from '@/store/ui-store';
import React from 'react';

export function FileListHeader() {
  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);
  const setFileListHeaderSizes = useUiStore(state => state.setFileListHeaderSizes);

  const titles = ['　', '名前', '拡張子', 'サイズ', '更新日時'];

  // ヘッダーリサイズ処理
  const startResize = (e: React.MouseEvent, index: number) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = fileListHeaderSizes[index];

    const onMouseMove = (e: MouseEvent) => {
      const moveRight = e.clientX - startX;

      const newSizes = [...fileListHeaderSizes];
      if (index === 1) {
        newSizes[0] = Math.min(50, Math.max(10, startWidth + moveRight));
      } else {
        newSizes[index] = Math.min(250, Math.max(10, startWidth - moveRight));
      }
      setFileListHeaderSizes(newSizes);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <tr className=" bg-gray-200 dark:bg-gray-900">
      {titles.map((s, i) => {
        return (
          <React.Fragment key={i}>
            <td>
              <div className="relative">
                {i !== 0 && (
                  <div
                    className="absolute top-0 left-0 h-full w-6 cursor-w-resize"
                    onMouseDown={e => startResize(e, i)}
                  />
                )}
                <div className="border-b border-r pl-1 text-ellipsis overflow-hidden text-nowrap">{s}</div>
              </div>
            </td>
          </React.Fragment>
        );
      })}
    </tr>
  );
}
