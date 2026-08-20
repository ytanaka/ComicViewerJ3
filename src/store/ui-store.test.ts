import { beforeEach, describe, expect, test } from 'vitest'
import { useUIStore } from './ui-store'

function st() {
    return useUIStore.getState()
}
function add3tabs() {
    const { addTab } = st();

    addTab({ id: 1, path: "a" });
    addTab({ id: 2, path: "b" });
    addTab({ id: 3, path: "c" });
}
function getTabIds() {
    return st().tabs.map((tab) => tab.id);
}

beforeEach(() => {
    useUIStore.setState({
        currentTabId: undefined,
        tabs: [],
    })

})

test('初期状態の確認', () => {
    expect(st().currentTabId).toBeUndefined();
    expect(st().tabs).toEqual([]);
})

describe('addTab', () => {
    test('正常動作', () => {
        add3tabs();

        expect(st().tabs).toEqual([
            { id: 1, path: "a" },
            { id: 2, path: "b" },
            { id: 3, path: "c" },
        ]);
    })
    test('重複するタブIDはエラーにする', () => {
        const { addTab } = st();
        add3tabs();

        expect(() => addTab({ id: 1, path: "xxx" })).toThrow('dup tab.id: 1');
        expect(() => addTab({ id: 2, path: "xxx" })).toThrow('dup tab.id: 2');
        expect(() => addTab({ id: 3, path: "xxx" })).toThrow('dup tab.id: 3');
    })
})

describe('moveTab', () => {
    test('正常動作', () => {
        const { moveTab } = st();
        add3tabs();

        moveTab(0, 0);
        expect(getTabIds()).toEqual([1, 2, 3]);
        moveTab(2, 2);
        expect(getTabIds()).toEqual([1, 2, 3]);

        moveTab(0, 1);
        expect(getTabIds()).toEqual([2, 1, 3]);

        moveTab(2, 0);
        expect(getTabIds()).toEqual([3, 2, 1]);
    })

    test('タブがないときエラー', () => {
        const { moveTab } = st();
        expect(() => moveTab(0, 0)).toThrow('empty tabs');
    })

    test('from,to インデックスが範囲外の場合はエラー', () => {
        const { moveTab } = st();
        add3tabs();

        expect(() => moveTab(-1, 0)).toThrow('invalid index: -1,0 tabs.length = 3');
        expect(() => moveTab(0, -1)).toThrow('invalid index: 0,-1 tabs.length = 3');

        expect(() => moveTab(0, 3)).toThrow('invalid index: 0,3 tabs.length = 3');
        expect(() => moveTab(3, 0)).toThrow('invalid index: 3,0 tabs.length = 3');
    })
})

describe('removeTab', () => {
    test('正常動作', () => {
        const { removeTab } = st();
        add3tabs();

        removeTab(0);
        expect(getTabIds()).toEqual([2, 3]);
        removeTab(1);
        expect(getTabIds()).toEqual([2]);
        removeTab(0);
        expect(getTabIds()).toEqual([]);
    })
})

describe('currentTabId', () => {
    test('通常動作', () => {
        const { setCurrentTabId } = st();
        add3tabs();

        setCurrentTabId(1);
        expect(st().currentTabId).toBe(1);
        setCurrentTabId(2);
        expect(st().currentTabId).toBe(2);
        setCurrentTabId(3);
        expect(st().currentTabId).toBe(3);
    })

    test('存在しないタブIDを渡すとエラー', () => {
        const { setCurrentTabId } = st();

        expect(() => setCurrentTabId(0)).toThrow('no tabId: 0');
        expect(() => setCurrentTabId(3)).toThrow('no tabId: 3');
    })

    test('空の状態で addTab するとそのIDになる', () => {
        st().addTab({id: 9, path: 'xxx'});
        expect(st().currentTabId).toBe(9);

        st().addTab({id: 1, path: 'xxx'});
        expect(st().currentTabId).toBe(9);
    })

    test('タブを add, move, remove してもカレントIDは変化しない', () => {
        const { setCurrentTabId } = st();
        const { addTab } = st();
        const { removeTab } = st();
        const { moveTab } = st();

        add3tabs();
        setCurrentTabId(1);

        addTab({ id: 9, path: "x" });
        expect(st().currentTabId).toBe(1);

        moveTab(0, 3);
        expect(st().currentTabId).toBe(1);

        removeTab(0);
        expect(st().currentTabId).toBe(1);
    })

    test('カレントタブを削除すると、カレントが移動する', () => {
        add3tabs();
        st().setCurrentTabId(2);

        st().removeTab(1);
        expect(getTabIds()).toEqual([1, 3]);
        expect(st().currentTabId).toBe(3);
    })
})
