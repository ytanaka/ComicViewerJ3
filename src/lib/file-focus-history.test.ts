import { expect, test } from 'vitest';
import { FileFocusHistory } from './file-focus-history';

test('追加されること', () => {
  const hist = new FileFocusHistory(10);
  hist.push('a', 'aa');
  hist.push('b', 'bb');
  hist.push('c', 'cc');
  expect(hist.hist.length).toBe(3);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'aa' });
  expect(hist.hist[1]).toEqual({ path: 'b', focusName: 'bb' });
  expect(hist.hist[2]).toEqual({ path: 'c', focusName: 'cc' });
});

test('重複は更新されること', () => {
  const hist = new FileFocusHistory(10);
  hist.push('a', 'aa');
  hist.push('a', 'bb');
  expect(hist.hist.length).toBe(1);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'bb' });
  hist.push('a', 'cc');
  expect(hist.hist.length).toBe(1);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'cc' });
});

test('古い情報が捨てられること', () => {
  const hist = new FileFocusHistory(2);
  hist.push('a', 'aa');
  hist.push('b', 'bb');
  expect(hist.hist.length).toBe(2);

  hist.push('c', 'cc');
  expect(hist.hist.length).toBe(2);
  expect(hist.hist[0]).toEqual({ path: 'b', focusName: 'bb' });
  expect(hist.hist[1]).toEqual({ path: 'c', focusName: 'cc' });
});
