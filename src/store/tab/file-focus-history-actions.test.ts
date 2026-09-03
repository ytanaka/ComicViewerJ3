import { beforeEach, describe, expect, test } from 'vitest';
import { useTabStore } from './store';
import { MAX_HIST, mkTabInfo, TabId } from './types';

function st() {
  return useTabStore.getState();
}

beforeEach(() => {
  useTabStore.setState({
    tabs: [],
    focusHistories: {},
    focusHistoryMax: MAX_HIST,
  });
});

test('初期状態', () => {
  expect(st().focusHistories).toMatchObject({});
});

describe('pushHistory', () => {
  test('追加されること', () => {
    const TAB_ID = 123 as TabId;
    st().addTab(mkTabInfo(TAB_ID, ''));
    st().pushHistory(TAB_ID, 'a', 'aa');
    st().pushHistory(TAB_ID, 'b', 'bb');
    st().pushHistory(TAB_ID, 'c', 'cc');
    const hist = st().focusHistories;
    expect(hist[TAB_ID].hist.length).toBe(3);
    expect(hist[TAB_ID].hist[0]).toEqual({ path: 'a', filename: 'aa' });
    expect(hist[TAB_ID].hist[1]).toEqual({ path: 'b', filename: 'bb' });
    expect(hist[TAB_ID].hist[2]).toEqual({ path: 'c', filename: 'cc' });
  });

  test('重複は更新されること', () => {
    const TAB_ID = 234 as TabId;
    st().addTab(mkTabInfo(TAB_ID, ''));
    {
      st().pushHistory(TAB_ID, 'a', 'aa');
      st().pushHistory(TAB_ID, 'a', 'bb');
      const hist = st().focusHistories;
      expect(hist[TAB_ID].hist.length).toBe(1);
      expect(hist[TAB_ID].hist[0]).toEqual({ path: 'a', filename: 'bb' });
    }
    {
      st().pushHistory(TAB_ID, 'a', 'cc');
      const hist = st().focusHistories;
      expect(hist[TAB_ID].hist.length).toBe(1);
      expect(hist[TAB_ID].hist[0]).toEqual({ path: 'a', filename: 'cc' });
    }
  });

  test('古い情報が捨てられること', () => {
    const TAB_ID = 123 as TabId;
    st().addTab(mkTabInfo(TAB_ID, ''));
    st().setFocusHistoryMax(2);
    expect(st().focusHistoryMax).toBe(2);
    {
      st().pushHistory(TAB_ID, 'a', 'aa');
      st().pushHistory(TAB_ID, 'b', 'bb');
      const hist = st().focusHistories;
      expect(hist[TAB_ID].hist.length).toBe(2);
    }
    {
      st().pushHistory(TAB_ID, 'c', 'cc');
      const hist = st().focusHistories;
      expect(hist[TAB_ID].hist.length).toBe(2);
      expect(hist[TAB_ID].hist[0]).toEqual({ path: 'b', filename: 'bb' });
      expect(hist[TAB_ID].hist[1]).toEqual({ path: 'c', filename: 'cc' });
    }
  });
});

test('findHistory', () => {
  const TAB_ID = 1 as TabId;
  st().addTab(mkTabInfo(TAB_ID, ''));
  st().pushHistory(TAB_ID, 'a', 'aaa');
  st().pushHistory(TAB_ID, 'b', 'bbb');
  st().pushHistory(TAB_ID, 'c', 'ccc');

  expect(st().findHistory(TAB_ID, 'a')).toBe('aaa');
  expect(st().findHistory(TAB_ID, 'c')).toBe('ccc');
  expect(st().findHistory(TAB_ID, 'z')).toBe(undefined);

  st().addTab(mkTabInfo(2 as TabId, ''));
  expect(st().findHistory(2 as TabId, 'a')).toBe(undefined);
});
