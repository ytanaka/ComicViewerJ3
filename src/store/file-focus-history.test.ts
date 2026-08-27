import { expect, test } from 'vitest';
import { createFileFocusHistory, FileFocusHistoryOp } from './file-focus-history';

test('追加されること', () => {
  const hist = createFileFocusHistory(10);
  const op = new FileFocusHistoryOp(hist);
  op.push('a', 'aa');
  op.push('b', 'bb');
  op.push('c', 'cc');
  expect(hist.hist.length).toBe(3);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'aa' });
  expect(hist.hist[1]).toEqual({ path: 'b', focusName: 'bb' });
  expect(hist.hist[2]).toEqual({ path: 'c', focusName: 'cc' });
});

test('重複は更新されること', () => {
  const hist = createFileFocusHistory(10);
  const op = new FileFocusHistoryOp(hist);
  op.push('a', 'aa');
  op.push('a', 'bb');
  expect(hist.hist.length).toBe(1);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'bb' });
  op.push('a', 'cc');
  expect(hist.hist.length).toBe(1);
  expect(hist.hist[0]).toEqual({ path: 'a', focusName: 'cc' });
});

test('古い情報が捨てられること', () => {
  const hist = createFileFocusHistory(2);
  const op = new FileFocusHistoryOp(hist);
  op.push('a', 'aa');
  op.push('b', 'bb');
  expect(hist.hist.length).toBe(2);

  op.push('c', 'cc');
  expect(hist.hist.length).toBe(2);
  expect(hist.hist[0]).toEqual({ path: 'b', focusName: 'bb' });
  expect(hist.hist[1]).toEqual({ path: 'c', focusName: 'cc' });
});
