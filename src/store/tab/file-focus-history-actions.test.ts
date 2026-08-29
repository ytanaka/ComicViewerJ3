import { beforeEach, describe, expect, test } from 'vitest';
import { useTabStore } from './store';
import { MAX_HIST } from './types';

function st() {
  return useTabStore.getState();
}

beforeEach(() => {
  useTabStore.setState({
    focusHistories: {},
    focusHistoryMax: MAX_HIST,
  });
});

test('初期状態', () => {
  expect(st().focusHistories).toMatchObject({});
});

describe('getHistory', () => {
  test('新しいタブIDが渡されたら focusHistories にキーが追加されること', () => {
    expect(st().focusHistories).toMatchObject({});
    expect(st().getHistory(1)).toMatchObject({ hist: [] });
    expect(Object.keys(st().focusHistories)).toMatchObject(['1']);
    expect(st().getHistory(1)).toMatchObject({ hist: [] });
    expect(Object.keys(st().focusHistories)).toMatchObject(['1']);
    expect(st().getHistory(2)).toMatchObject({ hist: [] });
    expect(Object.keys(st().focusHistories)).toMatchObject(['1', '2']);
  });
});

describe('pushHistory', () => {
  test('新しいタブIDが渡されたら focusHistories にキーが追加されること', () => {
    expect(st().focusHistories).toMatchObject({});
    st().pushHistory(1, 'a', 'a');
    expect(Object.keys(st().focusHistories)).toMatchObject(['1']);
    st().pushHistory(2, 'a', 'a');
    expect(Object.keys(st().focusHistories)).toMatchObject(['1', '2']);
    st().pushHistory(2, 'b', 'b');
    expect(Object.keys(st().focusHistories)).toMatchObject(['1', '2']);
  });

  test('追加されること', () => {
    st().pushHistory(123, 'a', 'aa');
    st().pushHistory(123, 'b', 'bb');
    st().pushHistory(123, 'c', 'cc');
    const hist = st().getHistory(123);
    expect(hist.hist.length).toBe(3);
    expect(hist.hist[0]).toEqual({ path: 'a', filename: 'aa' });
    expect(hist.hist[1]).toEqual({ path: 'b', filename: 'bb' });
    expect(hist.hist[2]).toEqual({ path: 'c', filename: 'cc' });
  });

  test('重複は更新されること', () => {
    {
      st().pushHistory(234, 'a', 'aa');
      st().pushHistory(234, 'a', 'bb');
      const hist = st().getHistory(234);
      expect(hist.hist.length).toBe(1);
      expect(hist.hist[0]).toEqual({ path: 'a', filename: 'bb' });
    }
    {
      st().pushHistory(234, 'a', 'cc');
      const hist = st().getHistory(234);
      expect(hist.hist.length).toBe(1);
      expect(hist.hist[0]).toEqual({ path: 'a', filename: 'cc' });
    }
  });

  test('古い情報が捨てられること', () => {
    st().setFocusHistoryMax(2);
    expect(st().focusHistoryMax).toBe(2);
    {
      st().pushHistory(123, 'a', 'aa');
      st().pushHistory(123, 'b', 'bb');
      const hist = st().getHistory(123);
      expect(hist.hist.length).toBe(2);
    }
    {
      st().pushHistory(123, 'c', 'cc');
      const hist = st().getHistory(123);
      expect(hist.hist.length).toBe(2);
      expect(hist.hist[0]).toEqual({ path: 'b', filename: 'bb' });
      expect(hist.hist[1]).toEqual({ path: 'c', filename: 'cc' });
    }
  });
});

test('findHistory', () => {
  st().pushHistory(1, 'a', 'aaa');
  st().pushHistory(1, 'b', 'bbb');
  st().pushHistory(1, 'c', 'ccc');

  expect(st().findHistory(1, 'a')).toBe('aaa');
  expect(st().findHistory(1, 'c')).toBe('ccc');
  expect(st().findHistory(1, 'z')).toBe(undefined);

  expect(st().findHistory(2, 'a')).toBe(undefined);
});
