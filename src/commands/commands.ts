import { invoke } from "@tauri-apps/api/core";

export type DirEntries = {
    0: string;     // full path
    1: DirEntry[];
};
export type DirEntry = {
    id: number;
    name: string;
}

export type FileInfo = {
    id: number;
    path: string;
    metadata: FileInfoMetadata | null;
};

export type FileInfoMetadata = {
    is_dir: boolean;
    size: number | null;
    modified: number | null;
    accessed: number | null;
    created: number | null;
};

// ディレクトリ読み込み
export const getDirectoryEntries: (path: string) => Promise<DirEntries> = async (path) => {
    return invoke("get_directory_entries", { path });
}

// ファイル情報取得
export const getFileInfo: (id: number) => Promise<FileInfo | null> = async (id) => {
    return invoke("get_file_info", { id });
}
