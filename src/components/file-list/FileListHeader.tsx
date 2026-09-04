import { SortType_type } from '@/lib/bindings-wrapper';
import { sortCommands } from '@/lib/commands/sort-commands';
import { useTabStore } from '@/store/tab/store';
import { useUiStore } from '@/store/ui-store';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

interface HeaderInfo {
  sortType: SortType_type | null;
  label: string | null;
}

export function FileListHeader() {
  const fileListHeaderSizes = useUiStore(state => state.fileListHeaderSizes);
  const setFileListHeaderSizes = useUiStore(state => state.setFileListHeaderSizes);
  const sortCondition = useTabStore(state => state.getCurrentTab().sortCondition);

  const titles: HeaderInfo[] = [
    { sortType: null, label: '　' },
    { sortType: 'Name', label: '名前' },
    { sortType: 'Ext', label: '拡張子' },
    { sortType: 'Size', label: 'サイズ' },
    { sortType: 'Time', label: '更新日時' },
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

  const handleClick = async (type: SortType_type | null) => {
    if (type === null) return;
    sortCommands.sortFiles(type);
  };

  function getIcon(type: SortType_type | null) {
    if (type === null || sortCondition.sort_type.type !== type) return (<></>);

    if (sortCondition.asc) {
      return (<ChevronUp className='pl-1 w-5' />);
    } else {
      return (<ChevronDown className='pl-1 w-5' />);
    }
  }

  return (
    <tr className=" bg-gray-200 dark:bg-gray-900">
      {titles.map((h, i) => {
        return (
          <React.Fragment key={i}>
            <td onClick={() => handleClick(h.sortType)}>
              <div className="relative">
                {i !== 0 && (
                  <div
                    className="absolute top-0 left-0 h-full w-3 cursor-w-resize"
                    onMouseDown={e => startResize(e, i)}
                  />
                )}
                <div
                  className="flex border-b border-r pl-1 text-ellipsis overflow-hidden text-nowrap">
                  <p>{h.label}</p>
                  {getIcon(h.sortType)}
                </div>
              </div>
            </td>
          </React.Fragment>
        );
      })}
    </tr>
  );
}
