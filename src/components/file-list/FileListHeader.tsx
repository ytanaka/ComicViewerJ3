import { rustcmds, SortType_type } from '@/lib/bindings-wrapper';
import { useTabStore } from '@/store/tab/store';
import { useUiStore } from '@/store/ui-store';
import React from 'react';

interface HeaderInfo {
  index: number;
  sortType: SortType_type | null;
  label: string | null;
}

export function FileListHeader() {
  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);
  const setFileListHeaderSizes = useUiStore(state => state.setFileListHeaderSizes);

  const titles: HeaderInfo[] = [
    { index: 0, sortType: null, label: '　' },
    { index: 1, sortType: 'Name', label: '名前' },
    { index: 2, sortType: 'Ext', label: '拡張子' },
    { index: 3, sortType: 'Size', label: 'サイズ' },
    { index: 4, sortType: 'Time', label: '更新日時' },
  ];

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

  const handleClick = async (index: number, type: SortType_type | null) => {
    if (type === null) return;

    const tab = useTabStore.getState().getCurrentTab();
    const cond = tab.sortCondition;
    if (cond.sort_type.type === type) {
      cond.asc = !cond.asc;
    } else {
      cond.sort_type = { type: type };
      cond.asc = true;
    }

    const result = await rustcmds.sortFiles(tab.id, cond);
    if (result.status === 'error') {
      // TODO: toast
      console.error(`rustcmds.sortFiles(${tab.id}) error ${result.error}`)
    } else {
      useTabStore.getState().setSortCondition(tab.id, cond);
    }

    console.debug('click: ', index);
  };

  return (
    <tr className=" bg-gray-200 dark:bg-gray-900">
      {titles.map((h, i) => {
        return (
          <React.Fragment key={i}>
            <td onClick={() => handleClick(i, h.sortType)}>
              <div className="relative">
                {i !== 0 && (
                  <div
                    className="absolute top-0 left-0 h-full w-3 cursor-w-resize"
                    onMouseDown={e => startResize(e, i)}
                  />
                )}
                <div className="border-b border-r pl-1 text-ellipsis overflow-hidden text-nowrap">{h.label}</div>
              </div>
            </td>
          </React.Fragment>
        );
      })}
    </tr>
  );
}
