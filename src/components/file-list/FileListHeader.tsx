import React, { useRef } from 'react';

export function FileListHeader() {
  const refList = useRef<(HTMLDivElement | null)[]>([]);
  const titles = ['　', '名前', '拡張子', 'サイズ', '更新日時'];

  return (
    <tr className=' bg-gray-200 dark:bg-gray-900'>
      {titles.map((s, i) => {
        return (
          <React.Fragment key={i}>
            <td
              ref={el => {
                refList.current[i] = el;
              }}
            >
              <div className='border-b border-r pl-1 text-ellipsis overflow-hidden text-nowrap'>
                {s}
              </div>
            </td>
          </React.Fragment>
        );
      })}
    </tr>
  );
}
