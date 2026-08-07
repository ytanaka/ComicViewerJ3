import { useEffect, useRef, useState } from "react";

import { path } from "@tauri-apps/api";
import { useQuery } from "@tanstack/react-query";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { unixTime2str } from "../utils/util";
import { DirEntry, FileInfo, getDirectoryEntries, getFileInfo } from "../commands/commands";

function Icon({ fileInfo }: { fileInfo: FileInfo | null | undefined }) {
    let icon: String;
    if (fileInfo?.metadata === null) {
        icon = "⬛";
    } else if (fileInfo?.metadata.is_dir) {
        icon = "📁";
    } else {
        icon = "📄";
    }

    return (
        <div className="file-list-item-elm" >
            {icon}
        </div>
    )
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
    return (
        <div className="file-list-item-elm" style={{ flex: "1" }}>
            {dirEntry.name}
        </div>
    )
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry, fileInfo: FileInfo | null | undefined }) {
    const [ext, setExt] = useState("");

    useEffect(() => {
        async function getExt() {
            if (!fileInfo?.metadata?.is_dir) {
                try {
                    const ext = await path.extname(dirEntry.name);
                    if (ext !== "") setExt(ext);
                } catch { }
            }
        }
        getExt();
    }, [dirEntry.name]);

    return (
        <div className="file-list-item-elm" style={{ width: "5ch" }} >
            {ext}
        </div>
    )
}
function Size({ fileInfo }: { fileInfo: FileInfo | null | undefined }) {
    let size = undefined;
    if (!fileInfo?.metadata?.is_dir) {
        size = fileInfo?.metadata?.size;
    }
    return (
        <div className="file-list-item-elm" style={{ width: "8ch", textAlign: "right" }} >
            {size}
        </div>
    )
}
function Modified({ fileInfo }: { fileInfo: FileInfo | null | undefined }) {
    return (
        <div className="file-list-item-elm" >
            {unixTime2str(fileInfo?.metadata?.modified)}
        </div>
    )
}

function FileListItem({ index, dirEntry, isSelected }: { index: number, dirEntry: DirEntry, isSelected: boolean }) {
    const { data } = useQuery({
        staleTime: 0,
        queryKey: [dirEntry.id],
        queryFn: async () => {
            const x = await getFileInfo(dirEntry.id)
            return x;
        }
    })

    return (
        <div className={index % 2 == 0 ? "" : "file-list-item2"}
            style={{
                display: "flex",
                padding: "4px 8px",
                background: isSelected ? "#0078d4" : "",
                height: "1lh",
            }} >
            <Icon fileInfo={data} />
            <Name dirEntry={dirEntry} />
            <FileExt dirEntry={dirEntry} fileInfo={data} />
            <Size fileInfo={data} />
            <Modified fileInfo={data} />
        </div>
    )
}

export default function FileList() {
    const [currentPath, setCurrentPath] = useState(".");
    const [entries, setEntries] = useState<DirEntry[]>([]);
    const virtuoso = useRef<VirtuosoHandle>(null);

    const refreshList = async (path: string) => {
        getDirectoryEntries(path).then((ret) => {
            setCurrentPath(ret[0]);
            setEntries(ret[1]);
            localStorage.setItem("path", path);
        });
    }

    // 初期ロード
    useEffect(() => {
        let path = localStorage.getItem("path");
        if (path === null) path = ".";
        refreshList(path);
    }, []);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 8, }}>
                Current: {currentPath}
            </div>

            <Virtuoso
                ref={virtuoso}
                totalCount={entries.length}
                itemContent={(index) => {
                    return (
                        <FileListItem index={index} dirEntry={entries[index]} isSelected={false} />
                    )
                }}
            />
        </div>
    );
}
