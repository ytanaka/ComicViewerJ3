import { FileInfo } from '@/lib/bindings';
import { FileInfoWrapper, TabId } from './types';
import { TabStore } from './store';

export interface FileInfoWrapperActions {
  clearFileInfoWrapper: (tabId: TabId) => void;

  getFileInfo: (tabId: TabId, index: number) => FileInfo | undefined;
  setFileInfo: (tabId: TabId, index: number, fileInfo: FileInfo) => void;
  getFileInfoErrorMsg: (tabId: TabId, index: number) => string | undefined;
  setFileInfoErrorMsg: (tabId: TabId, index: number, errorMsg: string) => void;
}

export const createFileInfoWrapperActions = (
  set: (fn: (state: TabStore) => Partial<TabStore>) => void,
  get: () => TabStore
): FileInfoWrapperActions => {
  function getWrapper(tabId: TabId, index: number): FileInfoWrapper | undefined {
    return get().fileInfoListList[tabId][index];
  }
  function setWrapper(tabId: TabId, index: number, wrapper: FileInfoWrapper) {
    set(state => ({
      fileInfoListList: {
        ...state.fileInfoListList,
        [tabId]: {
          ...state.fileInfoListList[tabId],
          [index]: wrapper,
        },
      },
    }));
  };

  return {
    clearFileInfoWrapper: (tabId: TabId) => {
      set(state => ({
        fileInfoListList: {
          ...state.fileInfoListList,
          [tabId]: {},
        },
      }));
    },

    getFileInfo: (tabId: TabId, index: number) => {
      return getWrapper(tabId, index)?.fileInfo;
    },
    getFileInfoErrorMsg: (tabId: TabId, index: number) => {
      return getWrapper(tabId, index)?.errorMsg;
    },

    setFileInfo: (tabId: TabId, index: number, fileInfo: FileInfo) => {
      setWrapper(tabId, index, { fileInfo });
    },
    setFileInfoErrorMsg: (tabId: TabId, index: number, errorMsg: string) => {
      setWrapper(tabId, index, { errorMsg });
    },
  }
};
