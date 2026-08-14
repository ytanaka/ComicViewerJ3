import { useEffect, useRef, useState } from 'react';

import { path } from '@tauri-apps/api';
import { useQuery } from '@tanstack/react-query';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { unixTime2str } from '../../utils/util';
import { commands, DirEntry, FileInfo } from '../../lib/bindings';
import { resolve as tauri_path_resolve } from '@tauri-apps/api/path';

function Icon({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  let icon: string;
  if (fileInfo === undefined || fileInfo.metadata === null) {
    icon = ' ';
  } else if (fileInfo?.metadata.is_dir) {
    icon = '📁';
  } else {
    icon = '📄';
  }
  return <div className="w-[2ch] ml-1 mr-1">{icon}</div>;
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
  return <div className="flex-1 ml-1 mr-1">{dirEntry.name}</div>;
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
  const [ext, setExt] = useState('');
  const isFile = !fileInfo?.metadata?.is_dir;

  useEffect(() => {
    async function getExt() {
      if (isFile) {
        const ext = await path.extname(dirEntry.name).catch(() => {
          return '';
        });
        if (ext !== '') setExt(ext);
      }
    }
    getExt();
  }, [dirEntry.name, isFile]);

  return <div className="w-[5ch] ml-1 mr-1">{ext}</div>;
}
function Size({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  let size = undefined;
  if (!fileInfo?.metadata?.is_dir) {
    size = fileInfo?.metadata?.size;
  }
  return <div className="w-[8ch] ml-1 mr-1 text-right">{size}</div>;
}
function Modified({ fileInfo }: { fileInfo: FileInfo | undefined }) {
  return <div className="ml-1 mr-1">{unixTime2str(fileInfo?.metadata?.modified)}</div>;
}

function FileListRow({ index, dirEntry, isSelected }: { index: number; dirEntry: DirEntry; isSelected: boolean }) {
  const { data } = useQuery({
    staleTime: 0,
    queryKey: [dirEntry.id],
    queryFn: async () => {
      const ret = await commands.getFileInfo(dirEntry.id.toString());
      if (ret.status === 'error') {
        console.error('getFileInfo(', dirEntry.name, ') => ', ret.error);
        throw Error(ret.error);
      }
      console.log('getFileInfo(', dirEntry.name, ') => ', ret.data);
      return ret.data;
    },
  });

  return (
    <div
      className={`${index % 2 == 0 ? '' : 'bg-gray-200 dark:bg-gray-900'} flex pl-1.5 pr-1.5 h-7`}
      style={{
        background: isSelected ? '#0078d4' : '',
      }}
    >
      <Icon fileInfo={data} />
      <Name dirEntry={dirEntry} />
      <FileExt dirEntry={dirEntry} fileInfo={data} />
      <Size fileInfo={data} />
      <Modified fileInfo={data} />
    </div>
  );
}

export default function FileList() {
  const [currentPath, setCurrentPath] = useState('.');
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const virtuoso = useRef<VirtuosoHandle>(null);

  // 初期ロード
  useEffect(() => {
    const canceled = new AbortController();
    const refreshList = async (path: string) => {
      const absPath = await tauri_path_resolve(path);
      const ret = await commands.getDirEntries(absPath);
      if (canceled.signal.aborted) {
        console.debug('FileList getDirEntries(', absPath, ') aborted');
        return;
      }
      if (ret.status === 'error') {
        console.error('FileList getDirEntries(', absPath, ') error: ', ret.error);
        return;
      }
      console.log('FileList getDirEntries(', absPath, ') success => data.length = ', ret.data.length);
      setCurrentPath(absPath);
      setEntries(ret.data);
      localStorage.setItem('path', absPath);
    };

    let path = localStorage.getItem('path');
    if (path === null) path = '.';
    refreshList(path);
    return () => {
      canceled.abort();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-2 border-2">Current: {currentPath}</div>

      <Virtuoso
        ref={virtuoso}
        totalCount={entries.length}
        itemContent={index => {
          return <FileListRow index={index} dirEntry={entries[index]} isSelected={false} />;
        }}
      />
    </div>
  );
}
