import { beforeEach, describe, expect, test } from 'vitest';
import { useTabStore } from './store';
import { MAX_HIST, mkUiTab, TabId } from './types';

function st() {
  return useTabStore.getState();
}
function addTab(id: number, path: string) {
  st().addTab(mkUiTab({ id: id as TabId, path }));
}

beforeEach(() => {
  useTabStore.setState({
    currentTabIndex: 0,
    tabs: [],
  });
});

describe('pushHistory', () => {
  test('追加されること', () => {
    const TAB_ID = 123 as TabId;
    addTab(TAB_ID, '');
    st().pushHistory(TAB_ID, 'a', 'aa');
    st().pushHistory(TAB_ID, 'b', 'bb');
    st().pushHistory(TAB_ID, 'c', 'cc');
    const hist = st().getTab(TAB_ID)!.focusHistories;
    expect(hist.length).toBe(3);
    expect(hist[0]).toEqual({ path: 'a', filename: 'aa' });
    expect(hist[1]).toEqual({ path: 'b', filename: 'bb' });
    expect(hist[2]).toEqual({ path: 'c', filename: 'cc' });
  });

  test('重複は更新されること', () => {
    const TAB_ID = 234 as TabId;
    addTab(TAB_ID, '');
    {
      st().pushHistory(TAB_ID, 'a', 'aa');
      st().pushHistory(TAB_ID, 'a', 'bb');
      const hist = st().getTab(TAB_ID)!.focusHistories;
      expect(hist.length).toBe(1);
      expect(hist[0]).toEqual({ path: 'a', filename: 'bb' });
    }
    {
      st().pushHistory(TAB_ID, 'a', 'cc');
      const hist = st().getTab(TAB_ID)!.focusHistories;
      expect(hist.length).toBe(1);
      expect(hist[0]).toEqual({ path: 'a', filename: 'cc' });
    }
  });

  test('古い情報が捨てられること', () => {
    const TAB_ID = 123 as TabId;
    const OVER = 10;
    addTab(TAB_ID, '');
    for (let i = 0; i < MAX_HIST + OVER; i++) {
      st().pushHistory(TAB_ID, `path-${i}`, `name-${i}`);
    }
    const hist = st().getTab(TAB_ID)!.focusHistories;
    expect(hist.length).toBe(MAX_HIST);
    expect(hist[0]).toEqual({ path: `path-${OVER}`, filename: `name-${OVER}` });
    expect(hist[MAX_HIST - 1]).toEqual({ path: `path-${MAX_HIST + OVER - 1}`, filename: `name-${MAX_HIST + OVER - 1}` });
  });
});

test('findHistory', () => {
  const TAB_ID = 1 as TabId;
  addTab(TAB_ID, '');
  st().pushHistory(TAB_ID, 'a', 'aaa');
  st().pushHistory(TAB_ID, 'b', 'bbb');
  st().pushHistory(TAB_ID, 'c', 'ccc');

  expect(st().findHistory(TAB_ID, 'a')).toBe('aaa');
  expect(st().findHistory(TAB_ID, 'c')).toBe('ccc');
  expect(st().findHistory(TAB_ID, 'z')).toBe(undefined);

  addTab(2 as TabId, '');
  expect(st().findHistory(2 as TabId, 'a')).toBe(undefined);
});
