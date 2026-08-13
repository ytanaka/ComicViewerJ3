import { useEffect, useRef, useState } from "react";

import { path } from "@tauri-apps/api";
import { useQuery } from "@tanstack/react-query";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { unixTime2str } from "../utils/util";
import { commands, DirEntry, FileInfo } from "../lib/bindings";
import { resolve } from "@tauri-apps/api/path";

function Icon({ fileInfo }: { fileInfo: FileInfo | undefined }) {
    let icon: String;
    if (fileInfo === undefined || fileInfo.metadata === null) {
        icon = " ";
    } else if (fileInfo?.metadata.is_dir) {
        icon = "📁";
    } else {
        icon = "📄";
    }

    return (
        <div className="file-list-row-elm" style={{ width: "2ch" }}>
            {icon}
        </div>
    )
}
function Name({ dirEntry }: { dirEntry: DirEntry }) {
    return (
        <div className="file-list-row-elm" style={{ flex: "1" }}>
            {dirEntry.name}
        </div>
    )
}
function FileExt({ dirEntry, fileInfo }: { dirEntry: DirEntry, fileInfo: FileInfo | undefined }) {
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
        <div className="file-list-row-elm" style={{ width: "5ch" }} >
            {ext}
        </div>
    )
}
function Size({ fileInfo }: { fileInfo: FileInfo | undefined }) {
    let size = undefined;
    if (!fileInfo?.metadata?.is_dir) {
        size = fileInfo?.metadata?.size;
    }
    return (
        <div className="file-list-row-elm" style={{ width: "8ch", textAlign: "right" }} >
            {size}
        </div>
    )
}
function Modified({ fileInfo }: { fileInfo: FileInfo | undefined }) {
    return (
        <div className="file-list-row-elm" >
            {unixTime2str(fileInfo?.metadata?.modified)}
        </div>
    )
}

function FileListRow({ index, dirEntry, isSelected }: { index: number, dirEntry: DirEntry, isSelected: boolean }) {
    const { data } = useQuery({
        staleTime: 0,
        queryKey: [dirEntry.id],
        queryFn: async () => {
            const ret = await commands.getFileInfo(dirEntry.id.toString())
            if (ret.status === 'error') throw Error(ret.error)
            console.log('getFileInfo(', dirEntry.name, ') => ', ret.data)
            return ret.data
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
        const absPath = await resolve(path);
        const ret = await commands.getDirEntries(absPath);
        if (ret.status === 'error') {
            // TODO
            return
        }
        setCurrentPath(absPath);
        setEntries(ret.data);
        localStorage.setItem("path", path);
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
                        <FileListRow index={index} dirEntry={entries[index]} isSelected={false} />
                    )
                }}
            />
        </div>
    );
}
