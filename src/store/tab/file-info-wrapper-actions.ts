import { FileInfo } from '@/lib/bindings';
import { FileInfoWrapper, TabId } from './types';
import { TabStore } from './store';

export interface FileInfoWrapperActions {
  clearFileInfos: (tabId: TabId) => void;

  getFileInfoWrapper: (tabId: TabId, index: number) => FileInfoWrapper;
  setFileInfoWrapper: (tabId: TabId, index: number, wrapper: FileInfoWrapper) => void;

  getFileInfo: (tabId: TabId, index: number) => FileInfo | undefined;
  setFileInfo: (tabId: TabId, index: number, fileInfo: FileInfo) => void;
  getFileInfoErrorMsg: (tabId: TabId, index: number) => string | undefined;
  setFileInfoErrorMsg: (tabId: TabId, index: number, errorMsg: string) => void;
}

export const createFileInfoWrapperActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): FileInfoWrapperActions => ({
  clearFileInfos: (tabId: TabId) => {
    delete get().fileInfos[tabId];
  },

  getFileInfoWrapper: (tabId: TabId, index: number) => {
    const infoList = get().fileInfos[tabId];
    if (infoList) {
      let ret = infoList[index];
      if (ret) return ret;

      ret = {};
      get().setFileInfoWrapper(tabId, index, ret);
      return ret;
    }

    const ret = {};
    get().setFileInfoWrapper(tabId, index, ret);
    return ret;
  },
  setFileInfoWrapper: (tabId: TabId, index: number, wrapper: FileInfoWrapper) => {
    set(state => ({
      fileInfos: {
        ...state.fileInfos,
        [tabId]: {
          ...state.fileInfos[tabId],
          [index]: wrapper,
        },
      },
    }));
  },

  getFileInfo: (tabId: TabId, index: number) => {
    return get().getFileInfoWrapper(tabId, index).fileInfo;
  },
  getFileInfoErrorMsg: (tabId: TabId, index: number) => {
    return get().getFileInfoWrapper(tabId, index).errorMsg;
  },

  setFileInfo: (tabId: TabId, index: number, fileInfo: FileInfo) => {
    get().setFileInfoWrapper(tabId, index, { fileInfo });
  },
  setFileInfoErrorMsg: (tabId: TabId, index: number, errorMsg: string) => {
    get().setFileInfoWrapper(tabId, index, { errorMsg });
  },
});
