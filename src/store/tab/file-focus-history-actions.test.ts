import { beforeEach, describe, expect, test } from 'vitest';
import { useTabStore } from './store';
import { MAX_HIST, mkTabInfo } from './types';

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
    st().addTab(mkTabInfo(123, ""));
    st().pushHistory(123, 'a', 'aa');
    st().pushHistory(123, 'b', 'bb');
    st().pushHistory(123, 'c', 'cc');
    const hist = st().focusHistories;
    expect(hist[123].hist.length).toBe(3);
    expect(hist[123].hist[0]).toEqual({ path: 'a', filename: 'aa' });
    expect(hist[123].hist[1]).toEqual({ path: 'b', filename: 'bb' });
    expect(hist[123].hist[2]).toEqual({ path: 'c', filename: 'cc' });
  });

  test('重複は更新されること', () => {
    st().addTab(mkTabInfo(234, ""));
    {
      st().pushHistory(234, 'a', 'aa');
      st().pushHistory(234, 'a', 'bb');
      const hist = st().focusHistories;
      expect(hist[234].hist.length).toBe(1);
      expect(hist[234].hist[0]).toEqual({ path: 'a', filename: 'bb' });
    }
    {
      st().pushHistory(234, 'a', 'cc');
      const hist = st().focusHistories;
      expect(hist[234].hist.length).toBe(1);
      expect(hist[234].hist[0]).toEqual({ path: 'a', filename: 'cc' });
    }
  });

  test('古い情報が捨てられること', () => {
    st().addTab(mkTabInfo(123, ""));
    st().setFocusHistoryMax(2);
    expect(st().focusHistoryMax).toBe(2);
    {
      st().pushHistory(123, 'a', 'aa');
      st().pushHistory(123, 'b', 'bb');
      const hist = st().focusHistories;
      expect(hist[123].hist.length).toBe(2);
    }
    {
      st().pushHistory(123, 'c', 'cc');
      const hist = st().focusHistories;
      expect(hist[123].hist.length).toBe(2);
      expect(hist[123].hist[0]).toEqual({ path: 'b', filename: 'bb' });
      expect(hist[123].hist[1]).toEqual({ path: 'c', filename: 'cc' });
    }
  });
});

test('findHistory', () => {
  st().addTab(mkTabInfo(1, ""));
  st().pushHistory(1, 'a', 'aaa');
  st().pushHistory(1, 'b', 'bbb');
  st().pushHistory(1, 'c', 'ccc');

  expect(st().findHistory(1, 'a')).toBe('aaa');
  expect(st().findHistory(1, 'c')).toBe('ccc');
  expect(st().findHistory(1, 'z')).toBe(undefined);

  st().addTab(mkTabInfo(2, ""));
  expect(st().findHistory(2, 'a')).toBe(undefined);
});
