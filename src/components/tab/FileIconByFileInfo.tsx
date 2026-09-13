import { FileIconByFilenameExt } from './FileIconByExt';

import FileFolderIcon from '@iconify-react/fluent-emoji-flat/file-folder';
import WhiteMediumSquareIcon from '@iconify-react/fluent-emoji-flat/white-medium-square';
import RedExclamationMarkIcon from '@iconify-react/fluent-emoji-flat/red-exclamation-mark';
import UpRightArrowIcon from '@iconify-react/fluent-emoji-flat/up-right-arrow';
import { DirEntry, FileInfo } from '@/lib/bindings-wrapper';
import { ReactNode } from 'react';

export function FileIconByFileInfo({ dirEntry, fileInfo }: { dirEntry: DirEntry; fileInfo: FileInfo | undefined }) {
  let icon: ReactNode;
  if (fileInfo?.metadata.Left) {
    icon = <RedExclamationMarkIcon height="100%" />;
  } else if (fileInfo === undefined) {
    icon = <WhiteMediumSquareIcon height="100%" />;
  } else if (dirEntry.is_symlink && dirEntry.is_dir) {
    icon = (
      <div className="relative h-full">
        <FileFolderIcon height="100%" />
        <div className="absolute right-0 bottom-0 w-[50%] h-[50%]">
          <UpRightArrowIcon />
        </div>
      </div>
    );
  } else if (dirEntry.is_symlink) {
    icon = (
      <div className="relative h-full">
        <FileIconByFilenameExt filename={dirEntry.name} />
        <div className="absolute right-0 bottom-0 w-[50%] h-[50%]">
          <UpRightArrowIcon />
        </div>
      </div>
    );
  } else if (dirEntry.is_dir) {
    icon = <FileFolderIcon height="100%" />;
  } else {
    icon = <FileIconByFilenameExt filename={dirEntry.name} />;
  }
  return (<>{icon}</>);
}
