import { DirEntry } from '@/lib/bindings-wrapper';
import { getFileExtension } from '@/lib/string-util';

import OpticalDiskIcon from '@iconify-react/fluent-emoji-flat/optical-disk';
import PageFacingUpIcon from '@iconify-react/fluent-emoji-flat/page-facing-up';

import FolderTypeWindowsIcon from '@iconify-react/vscode-icons/folder-type-windows';
import DefaultFileIcon from '@iconify-react/vscode-icons/default-file';
import FileTypeImageIcon from '@iconify-react/vscode-icons/file-type-image';
import FileTypeConfigIcon from '@iconify-react/vscode-icons/file-type-config';
import FileTypeVideoIcon from '@iconify-react/vscode-icons/file-type-video';
import FileTypeSvgIcon from '@iconify-react/vscode-icons/file-type-svg';
import FileTypeShellIcon from '@iconify-react/vscode-icons/file-type-shell';
import FileTypeHtmlIcon from '@iconify-react/vscode-icons/file-type-html';
import FileTypeTypescriptIcon from '@iconify-react/vscode-icons/file-type-typescript';
import FileTypeJsIcon from '@iconify-react/vscode-icons/file-type-js';
import FileTypeMarkdownIcon from '@iconify-react/vscode-icons/file-type-markdown';
import FileTypeJsonIcon from '@iconify-react/vscode-icons/file-type-json';
import FileTypeYamlIcon from '@iconify-react/vscode-icons/file-type-yaml';
import FileTypeRustIcon from '@iconify-react/vscode-icons/file-type-rust';
import FileTypeRubyIcon from '@iconify-react/vscode-icons/file-type-ruby';
import FileTypeJavaIcon from '@iconify-react/vscode-icons/file-type-java';
import FileTypeCIcon from '@iconify-react/vscode-icons/file-type-c';
import FileTypeCssIcon from '@iconify-react/vscode-icons/file-type-css';
import FileTypeCheaderIcon from '@iconify-react/vscode-icons/file-type-cheader';
import FileTypeCppheaderIcon from '@iconify-react/vscode-icons/file-type-cppheader';
import FileTypeCppIcon from '@iconify-react/vscode-icons/file-type-cpp';
import FileTypePythonIcon from '@iconify-react/vscode-icons/file-type-python';
import FileTypePowershellIcon from '@iconify-react/vscode-icons/file-type-powershell';
import FileTypePdf2Icon from '@iconify-react/vscode-icons/file-type-pdf2';
import FileTypeExcelIcon from '@iconify-react/vscode-icons/file-type-excel';
import FileTypeWordIcon from '@iconify-react/vscode-icons/file-type-word';
import FileTypeLibreofficeCalcIcon from '@iconify-react/vscode-icons/file-type-libreoffice-calc';
import FileTypeLibreofficeWriterIcon from '@iconify-react/vscode-icons/file-type-libreoffice-writer';
import FileTypeZip2Icon from '@iconify-react/vscode-icons/file-type-zip2';

const extIconList = [
  { ext: 'tiff', icon: FileTypeImageIcon },
  { ext: 'webp', icon: FileTypeImageIcon },
  { ext: 'jpeg', icon: FileTypeImageIcon },
  { ext: 'jpg', icon: FileTypeImageIcon },
  { ext: 'bmp', icon: FileTypeImageIcon },
  { ext: 'gif', icon: FileTypeImageIcon },
  { ext: 'ico', icon: FileTypeImageIcon },
  { ext: 'png', icon: FileTypeImageIcon },

  { ext: 'mpeg', icon: FileTypeVideoIcon },
  { ext: 'mpg', icon: FileTypeVideoIcon },
  { ext: 'avi', icon: FileTypeVideoIcon },
  { ext: 'mp4', icon: FileTypeVideoIcon },
  { ext: 'mov', icon: FileTypeVideoIcon },
  { ext: 'mrk', icon: FileTypeVideoIcon },
  { ext: 'wmv', icon: FileTypeVideoIcon },
  { ext: 'webm', icon: FileTypeVideoIcon },

  { ext: 'gzip', icon: FileTypeZip2Icon },
  { ext: 'bz2', icon: FileTypeZip2Icon },
  { ext: 'cab', icon: FileTypeZip2Icon },
  { ext: 'lzh', icon: FileTypeZip2Icon },
  { ext: 'rar', icon: FileTypeZip2Icon },
  { ext: 'tar', icon: FileTypeZip2Icon },
  { ext: 'zip', icon: FileTypeZip2Icon },
  { ext: '7z', icon: FileTypeZip2Icon },
  { ext: 'gz', icon: FileTypeZip2Icon },
  { ext: 'xz', icon: FileTypeZip2Icon },
  { ext: 'z', icon: FileTypeZip2Icon },

  { ext: 'txt', icon: PageFacingUpIcon },
  { ext: 'log', icon: PageFacingUpIcon },
  { ext: 'csv', icon: PageFacingUpIcon },
  { ext: 'tsv', icon: PageFacingUpIcon },
  { ext: 'ini', icon: FileTypeConfigIcon },

  { ext: 'json', icon: FileTypeJsonIcon },
  { ext: 'html', icon: FileTypeHtmlIcon },
  { ext: 'yaml', icon: FileTypeYamlIcon },
  { ext: 'htm', icon: FileTypeHtmlIcon },
  { ext: 'css', icon: FileTypeCssIcon },
  { ext: 'jsx', icon: FileTypeJsIcon },
  { ext: 'tsx', icon: FileTypeTypescriptIcon },
  { ext: 'js', icon: FileTypeJsIcon },
  { ext: 'ts', icon: FileTypeTypescriptIcon },
  { ext: 'md', icon: FileTypeMarkdownIcon },

  { ext: 'java', icon: FileTypeJavaIcon },
  { ext: 'rs', icon: FileTypeRustIcon },
  { ext: 'rb', icon: FileTypeRubyIcon },
  { ext: 'py', icon: FileTypePythonIcon },

  { ext: 'cpp', icon: FileTypeCppIcon },
  { ext: 'cxx', icon: FileTypeCppIcon },
  { ext: 'hpp', icon: FileTypeCppheaderIcon },
  { ext: 'cc', icon: FileTypeCppIcon },
  { ext: 'c', icon: FileTypeCIcon },
  { ext: 'h', icon: FileTypeCheaderIcon },

  { ext: 'bat', icon: FileTypePowershellIcon },
  { ext: 'cmd', icon: FileTypePowershellIcon },
  { ext: 'ps1', icon: FileTypePowershellIcon },
  { ext: 'sh', icon: FileTypeShellIcon },

  { ext: 'exe', icon: FolderTypeWindowsIcon },

  { ext: 'iso', icon: OpticalDiskIcon },
  { ext: 'svg', icon: FileTypeSvgIcon },
  { ext: 'pdf', icon: FileTypePdf2Icon },

  { ext: 'xlsx', icon: FileTypeExcelIcon },
  { ext: 'xlsm', icon: FileTypeExcelIcon },
  { ext: 'xls', icon: FileTypeExcelIcon },
  { ext: 'docx', icon: FileTypeWordIcon },
  { ext: 'docm', icon: FileTypeWordIcon },
  { ext: 'doc', icon: FileTypeWordIcon },

  { ext: 'odt', icon: FileTypeLibreofficeWriterIcon },
  { ext: 'ods', icon: FileTypeLibreofficeCalcIcon },
] as const;

export function FileExtIcon({ dirEntry }: { dirEntry: DirEntry }) {
  const ext = getFileExtension(dirEntry.name)?.toLowerCase();
  const find = extIconList.find(elm => elm.ext === ext);
  if (!ext || !find) return <DefaultFileIcon />;

  return <find.icon />;
}
