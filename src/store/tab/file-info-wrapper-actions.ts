import { FileId, FileInfoWrapper, TabId } from './types';
import { TabStore } from './store';
import { FileInfo } from '@/lib/bindings-wrapper';

export interface FileInfoWrapperActions {
  clearFileInfoWrapper: (tabId: TabId) => void;

  getFileInfo: (tabId: TabId, fileId: FileId) => FileInfo | undefined;
  setFileInfo: (tabId: TabId, fileId: FileId, fileInfo: FileInfo) => void;
  // setFileInfos: (tabId: TabId, fileId: FileId, fileInfo: FileInfo) => void;
  getFileInfoErrorMsg: (tabId: TabId, fileId: FileId) => string | undefined;
  setFileInfoErrorMsg: (tabId: TabId, fileId: FileId, errorMsg: string) => void;
}

export const createFileInfoWrapperActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): FileInfoWrapperActions => {
  function getWrapper(tabId: TabId, fileId: FileId): FileInfoWrapper | undefined {
    return get().fileInfoListList[tabId][fileId];
  }
  function setWrapper(tabId: TabId, fileId: FileId, wrapper: FileInfoWrapper) {
    set(state => ({
      fileInfoListList: {
        ...state.fileInfoListList,
        [tabId]: {
          ...state.fileInfoListList[tabId],
          [fileId]: wrapper,
        },
      },
    }));
  }

  return {
    clearFileInfoWrapper: (tabId: TabId) => {
      set(state => ({
        fileInfoListList: {
          ...state.fileInfoListList,
          [tabId]: {},
        },
      }));
    },

    getFileInfo: (tabId: TabId, fileId: FileId) => {
      return getWrapper(tabId, fileId)?.fileInfo;
    },
    getFileInfoErrorMsg: (tabId: TabId, fileId: FileId) => {
      return getWrapper(tabId, fileId)?.errorMsg;
    },

    setFileInfo: (tabId: TabId, fileId: FileId, fileInfo: FileInfo) => {
      setWrapper(tabId, fileId, { fileInfo });
    },
    setFileInfoErrorMsg: (tabId: TabId, fileId: FileId, errorMsg: string) => {
      setWrapper(tabId, fileId, { errorMsg });
    },
  };
};
