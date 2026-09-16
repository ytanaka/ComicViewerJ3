import { Icon } from '@iconify/react';

import opticalDisk from '@iconify-icons/fluent-emoji-flat/optical-disk';
import pageFacingUp from '@iconify-icons/fluent-emoji-flat/page-facing-up';
import framedPicture from '@iconify-icons/fluent-emoji-flat/framed-picture';

import folderTypeWindows from '@iconify-icons/vscode-icons/folder-type-windows';
import defaultFile from '@iconify-icons/vscode-icons/default-file';
import fileTypeConfig from '@iconify-icons/vscode-icons/file-type-config';
import fileTypeVideo from '@iconify-icons/vscode-icons/file-type-video';
import fileTypeSvg from '@iconify-icons/vscode-icons/file-type-svg';
import fileTypeShell from '@iconify-icons/vscode-icons/file-type-shell';
import fileTypeHtml from '@iconify-icons/vscode-icons/file-type-html';
import fileTypeTypescript from '@iconify-icons/vscode-icons/file-type-typescript';
import fileTypeJs from '@iconify-icons/vscode-icons/file-type-js';
import fileTypeMarkdown from '@iconify-icons/vscode-icons/file-type-markdown';
import fileTypeJson from '@iconify-icons/vscode-icons/file-type-json';
import fileTypeYaml from '@iconify-icons/vscode-icons/file-type-yaml';
import fileTypeRust from '@iconify-icons/vscode-icons/file-type-rust';
import fileTypeRuby from '@iconify-icons/vscode-icons/file-type-ruby';
import fileTypeJava from '@iconify-icons/vscode-icons/file-type-java';
import fileTypeC from '@iconify-icons/vscode-icons/file-type-c';
import fileTypeCss from '@iconify-icons/vscode-icons/file-type-css';
import fileTypeCheader from '@iconify-icons/vscode-icons/file-type-cheader';
import fileTypeCppheader from '@iconify-icons/vscode-icons/file-type-cppheader';
import fileTypeCpp from '@iconify-icons/vscode-icons/file-type-cpp';
import fileTypePython from '@iconify-icons/vscode-icons/file-type-python';
import fileTypePowershell from '@iconify-icons/vscode-icons/file-type-powershell';
import fileTypePdf2 from '@iconify-icons/vscode-icons/file-type-pdf2';
import fileTypeExcel from '@iconify-icons/vscode-icons/file-type-excel';
import fileTypeWord from '@iconify-icons/vscode-icons/file-type-word';
import fileTypeLibreofficeCalc from '@iconify-icons/vscode-icons/file-type-libreoffice-calc';
import fileTypeLibreofficeWriter from '@iconify-icons/vscode-icons/file-type-libreoffice-writer';
import fileTypeZip2 from '@iconify-icons/vscode-icons/file-type-zip2';

import { getFileExtension } from '@/lib/string-util';

/*
Tauriの Linux release ビルドでアイコンが表示されない問題について

devtools のエラー出力
  [Error] Refused to connect to https://api.iconify.design/fluent-emoji-flat.json?icons=page-facing-up because it does not appear in the connect-src directive of the Content Security Policy.

原因
  アイコンファイルを https://api.iconify.design から取得しようとして csp エラーになっている

修正前
  package.json 
    "@iconify-react/fluent-emoji-flat": "^1.0.3",
    "@iconify-react/vscode-icons": "^1.0.35",
tsx
  import framedPicture from '@iconify-icons/fluent-emoji-flat/framed-picture';
  import folderTypeWindows from '@iconify-icons/vscode-icons/folder-type-windows';    

修正後
  package.json 
    "@iconify-icons/fluent-emoji-flat": "^2.0.0",
    "@iconify-icons/vscode-icons": "^2.0.4",
    "@iconify/react": "^6.0.2",    
tsx
  import FramedPictureIcon from '@iconify-react/fluent-emoji-flat/framed-picture';
  import FolderTypeWindowsIcon from '@iconify-react/vscode-icons/folder-type-windows';
*/

const extIconList = [
  { ext: 'tiff', icon: framedPicture },
  { ext: 'webp', icon: framedPicture },
  { ext: 'jpeg', icon: framedPicture },
  { ext: 'jpg', icon: framedPicture },
  { ext: 'bmp', icon: framedPicture },
  { ext: 'gif', icon: framedPicture },
  { ext: 'ico', icon: framedPicture },
  { ext: 'png', icon: framedPicture },

  { ext: 'mpeg', icon: fileTypeVideo },
  { ext: 'mpg', icon: fileTypeVideo },
  { ext: 'avi', icon: fileTypeVideo },
  { ext: 'mp4', icon: fileTypeVideo },
  { ext: 'mov', icon: fileTypeVideo },
  { ext: 'mrk', icon: fileTypeVideo },
  { ext: 'wmv', icon: fileTypeVideo },
  { ext: 'webm', icon: fileTypeVideo },

  { ext: 'gzip', icon: fileTypeZip2 },
  { ext: 'bz2', icon: fileTypeZip2 },
  { ext: 'cab', icon: fileTypeZip2 },
  { ext: 'lzh', icon: fileTypeZip2 },
  { ext: 'rar', icon: fileTypeZip2 },
  { ext: 'tar', icon: fileTypeZip2 },
  { ext: 'zip', icon: fileTypeZip2 },
  { ext: '7z', icon: fileTypeZip2 },
  { ext: 'gz', icon: fileTypeZip2 },
  { ext: 'xz', icon: fileTypeZip2 },
  { ext: 'z', icon: fileTypeZip2 },

  { ext: 'txt', icon: pageFacingUp },
  { ext: 'log', icon: pageFacingUp },
  { ext: 'csv', icon: pageFacingUp },
  { ext: 'tsv', icon: pageFacingUp },
  { ext: 'ini', icon: fileTypeConfig },

  { ext: 'json', icon: fileTypeJson },
  { ext: 'html', icon: fileTypeHtml },
  { ext: 'yaml', icon: fileTypeYaml },
  { ext: 'htm', icon: fileTypeHtml },
  { ext: 'css', icon: fileTypeCss },
  { ext: 'jsx', icon: fileTypeJs },
  { ext: 'tsx', icon: fileTypeTypescript },
  { ext: 'js', icon: fileTypeJs },
  { ext: 'ts', icon: fileTypeTypescript },
  { ext: 'md', icon: fileTypeMarkdown },

  { ext: 'java', icon: fileTypeJava },
  { ext: 'rs', icon: fileTypeRust },
  { ext: 'rb', icon: fileTypeRuby },
  { ext: 'py', icon: fileTypePython },

  { ext: 'cpp', icon: fileTypeCpp },
  { ext: 'cxx', icon: fileTypeCpp },
  { ext: 'hpp', icon: fileTypeCppheader },
  { ext: 'cc', icon: fileTypeCpp },
  { ext: 'c', icon: fileTypeC },
  { ext: 'h', icon: fileTypeCheader },

  { ext: 'bat', icon: fileTypePowershell },
  { ext: 'cmd', icon: fileTypePowershell },
  { ext: 'ps1', icon: fileTypePowershell },
  { ext: 'sh', icon: fileTypeShell },

  { ext: 'exe', icon: folderTypeWindows },

  { ext: 'iso', icon: opticalDisk },
  { ext: 'svg', icon: fileTypeSvg },
  { ext: 'pdf', icon: fileTypePdf2 },

  { ext: 'xlsx', icon: fileTypeExcel },
  { ext: 'xlsm', icon: fileTypeExcel },
  { ext: 'xls', icon: fileTypeExcel },
  { ext: 'docx', icon: fileTypeWord },
  { ext: 'docm', icon: fileTypeWord },
  { ext: 'doc', icon: fileTypeWord },

  { ext: 'odt', icon: fileTypeLibreofficeWriter },
  { ext: 'ods', icon: fileTypeLibreofficeCalc },
] as const;

export function FileIconByFilenameExt({ filename }: { filename: string }) {
  const ext = getFileExtension(filename)?.toLowerCase();

  const find = extIconList.find(elm => elm.ext === ext);

  if (!ext || !find) {
    return <Icon icon={defaultFile} height="100%" />;
  }

  return <Icon icon={find.icon} height="100%" />;
}
