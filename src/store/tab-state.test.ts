import { beforeEach, describe, expect, test } from 'vitest';
import { useTabState } from './tab-state';
import { ListFiles } from '@/lib/list-files';

function st() {
  return useTabState.getState();
}

function addTab(id: number, path: string) {
  st().addTab({ id, path, list: new ListFiles() });
}

function add3tabs() {
  addTab(1, 'a');
  addTab(2, 'b');
  addTab(3, 'c');
}
function getTabIds() {
  return st().tabs.map(tab => tab.id);
}

beforeEach(() => {
  useTabState.setState({
    currentTabIndex: undefined,
    tabs: [],
  });
});

test('初期状態の確認', () => {
  expect(st().currentTabIndex).toBeUndefined();
  expect(st().tabs).toEqual([]);
});

describe('addTab', () => {
  test('正常動作', () => {
    add3tabs();

    expect(st().tabs).toMatchObject([
      { id: 1, path: 'a' },
      { id: 2, path: 'b' },
      { id: 3, path: 'c' },
    ]);
  });
  test('重複するタブIDはエラーにする', () => {
    add3tabs();

    expect(() => addTab(1, 'xxx')).toThrow('dup tab.id: 1');
    expect(() => addTab(2, 'xxx')).toThrow('dup tab.id: 2');
    expect(() => addTab(3, 'xxx')).toThrow('dup tab.id: 3');
  });
});

describe('moveTab', () => {
  test('正常動作', () => {
    add3tabs();

    st().moveTab(0, 0);
    expect(getTabIds()).toEqual([1, 2, 3]);
    st().moveTab(2, 2);
    expect(getTabIds()).toEqual([1, 2, 3]);

    st().moveTab(0, 1);
    expect(getTabIds()).toEqual([2, 1, 3]);

    st().moveTab(2, 0);
    expect(getTabIds()).toEqual([3, 2, 1]);
  });

  test('タブがないときエラー', () => {
    expect(() => st().moveTab(0, 0)).toThrow('empty tabs');
  });

  test('from,to インデックスが範囲外の場合はエラー', () => {
    add3tabs();

    expect(() => st().moveTab(-1, 0)).toThrow('invalid index: -1,0 tabs.length = 3');
    expect(() => st().moveTab(0, -1)).toThrow('invalid index: 0,-1 tabs.length = 3');

    expect(() => st().moveTab(0, 3)).toThrow('invalid index: 0,3 tabs.length = 3');
    expect(() => st().moveTab(3, 0)).toThrow('invalid index: 3,0 tabs.length = 3');
  });
});

describe('removeTab', () => {
  test('正常動作', () => {
    add3tabs();

    st().removeTab(0);
    expect(getTabIds()).toEqual([2, 3]);
    st().removeTab(1);
    expect(getTabIds()).toEqual([2]);
    st().removeTab(0);
    expect(getTabIds()).toEqual([]);
  });

  test('空の状態で削除するとエラー', () => {
    add3tabs();

    st().removeTab(0);
    st().removeTab(0);
    st().removeTab(0);

    expect(() => st().removeTab(0)).toThrow('invalid index: 0 tabs.length = 0');
  });
});

describe('currentTabId', () => {
  test('通常動作', () => {
    add3tabs();

    st().setCurrentTabIndex(0);
    expect(st().currentTabIndex).toBe(0);
    st().setCurrentTabIndex(1);
    expect(st().currentTabIndex).toBe(1);
    st().setCurrentTabIndex(2);
    expect(st().currentTabIndex).toBe(2);
  });

  test('存在しないインデックスを渡すとエラー', () => {
    expect(() => st().setCurrentTabIndex(0)).not.toThrow();
    expect(() => st().setCurrentTabIndex(1)).toThrow('setCurrentTabIndex(): invalid tab index: 1');
    expect(() => st().setCurrentTabIndex(-1)).toThrow('setCurrentTabIndex(): invalid tab index: -1');

    add3tabs();
    expect(() => st().setCurrentTabIndex(2)).not.toThrow();
    expect(() => st().setCurrentTabIndex(3)).toThrow('setCurrentTabIndex(): invalid tab index: 3');
  });

  test('addTab するとそのタブになる', () => {
    addTab(9, 'xxx');
    expect(st().currentTabIndex).toBe(0);

    addTab(1, 'xxx');
    expect(st().currentTabIndex).toBe(1);

    addTab(2, 'xxx');
    expect(st().currentTabIndex).toBe(2);
  });

  test('タブを move するとカレントも移動する', () => {
    add3tabs();
    st().setCurrentTabIndex(0);
    expect(st().currentTabIndex).toBe(0);

    // [(a)bc] => [bc(a)]
    st().moveTab(0, 2);
    expect(st().currentTabIndex).toBe(2);

    // [bc(a)] => [c(a)b]
    st().moveTab(0, 2);
    expect(st().currentTabIndex).toBe(1);

    // [c(a)b] => [(a)bc]
    st().moveTab(0, 2);
    expect(st().currentTabIndex).toBe(0);

    // [(a)bc] => [b(a)c]
    st().moveTab(0, 1);
    expect(st().currentTabIndex).toBe(1);

    // [b(a)c] => [(a)bc]
    st().moveTab(1, 0);
    expect(st().currentTabIndex).toBe(0);

    // [(a)bc] => [c(a)b]
    st().moveTab(2, 0);
    expect(st().currentTabIndex).toBe(1);
  });

  test('カレントタブを削除すると、カレントが移動する', () => {
    add3tabs();
    expect(getTabIds()).toEqual([1, 2, 3]);
    st().setCurrentTabIndex(2);

    st().removeTab(1);
    expect(getTabIds()).toEqual([1, 3]);
    expect(st().currentTabIndex).toBe(1);

    st().removeTab(1);
    expect(getTabIds()).toEqual([1]);
    expect(st().currentTabIndex).toBe(0);

    st().removeTab(0);
    expect(getTabIds()).toEqual([]);
    expect(st().currentTabIndex).toBe(0);
  });
});
