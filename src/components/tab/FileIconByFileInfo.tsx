import { Icon } from '@iconify/react';

import fileFolder from '@iconify-icons/fluent-emoji-flat/file-folder';
import upRightArrow from '@iconify-icons/fluent-emoji-flat/up-right-arrow';

import { DirEntry } from '@/lib/bindings-wrapper';
import { ReactNode } from 'react';
import { FileIconByFilenameExt } from './FileIconByExt';

export function FileIconByFileInfo({ dirEntry }: { dirEntry: DirEntry }) {
  let icon: ReactNode;
  if (dirEntry.is_symlink && dirEntry.is_dir) {
    icon = (
      <div className="relative h-full">
        <Icon icon={fileFolder} height="100%" />
        <div className="absolute right-0 bottom-0 w-[50%] h-[50%]">
          <Icon icon={upRightArrow} />
        </div>
      </div>
    );
  } else if (dirEntry.is_symlink) {
    icon = (
      <div className="relative h-full">
        <FileIconByFilenameExt filename={dirEntry.name} />
        <div className="absolute right-0 bottom-0 w-[50%] h-[50%]">
          <Icon icon={upRightArrow} />
        </div>
      </div>
    );
  } else if (dirEntry.is_dir) {
    icon = <Icon icon={fileFolder} height="100%" />;
  } else {
    icon = <FileIconByFilenameExt filename={dirEntry.name} />;
  }
  return <>{icon}</>;
}
