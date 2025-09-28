/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// gantt-chart-component.js のコードを読み込む
const componentJs = fs.readFileSync(path.resolve(__dirname, '../dist/gantt-chart-component.js'), 'utf8');
// gantt-chart-component.html のコードを読み込む
const componentHtml = fs.readFileSync(path.resolve(__dirname, '../dist/gantt-chart-component.html'), 'utf8');

// D3.jsのより詳細なモック
const selectionMock = {
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    each: jest.fn(function(callback) { return this; }),
    filter: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
};

const axisMock = {
    ticks: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis(),
};

const scaleFn = jest.fn().mockReturnValue(0); // スケール関数は数値を返す
scaleFn.domain = jest.fn().mockReturnThis();
scaleFn.range = jest.fn().mockReturnThis();
scaleFn.padding = jest.fn().mockReturnThis();
scaleFn.ticks = jest.fn().mockReturnThis();
scaleFn.bandwidth = jest.fn().mockReturnValue(20); // バンド幅のモック

global.d3 = {
    select: jest.fn().mockReturnValue(selectionMock),
    selectAll: jest.fn().mockReturnValue(selectionMock),
    scaleBand: jest.fn().mockReturnValue(scaleFn),
    scaleTime: jest.fn().mockReturnValue(scaleFn),
    timeFormat: jest.fn().mockReturnValue(jest.fn()),
    timeDay: { every: jest.fn(), offset: (d) => d },
    timeHour: { every: jest.fn() },
    timeMinute: { every: jest.fn() },
    axisTop: jest.fn().mockReturnValue(axisMock),
    axisLeft: jest.fn().mockReturnValue(axisMock),
    min: jest.fn((items, accessor) => items && items.length > 0 ? accessor(items.reduce((a, b) => accessor(a) < accessor(b) ? a : b)) : new Date()),
    max: jest.fn((items, accessor) => items && items.length > 0 ? accessor(items.reduce((a, b) => accessor(a) > accessor(b) ? a : b)) : new Date()),
    group: jest.fn().mockReturnValue(new Map()),
};

describe('GanttChartComponent', () => {

    beforeAll(() => {
        // コンポーネントの登録は、すべてのテストの前に一度だけ実行する
        eval(componentJs);
    });

    beforeEach(() => {
        // fetchをモックする
        fetch.resetMocks();

        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('config.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ title: 'Test Title' }) });
            }
            if (url.endsWith('config-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.endsWith('schedule-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ equipment: ['EQ1'], items: [], links: [] }) });
            }
            if (url.endsWith('alert-definitions.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('d3js.org')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve('// d3 mock') });
            }
            return Promise.reject(new Error(`unhandled fetch request: ${url}`));
        });

        // JSDOMのDOMにコンポーネントを追加
        document.body.innerHTML = `
            <gantt-chart-component
                properties-url="config.json"
                data-config-url="config-data.json"
                data-url="schedule-data.json"
                alert-definitions-url="alert-definitions.json"
            ></gantt-chart-component>
        `;
    });

    beforeEach(() => {
        // 各テストの前にモックをクリア
        jest.clearAllMocks();
        fetch.resetMocks();

        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('config.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ title: 'Test Title' }) });
            }
            if (url.endsWith('config-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.endsWith('schedule-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ equipment: ['EQ1'], items: [], links: [] }) });
            }
            if (url.endsWith('alert-definitions.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            if (url.includes('d3js.org')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve('// d3 mock') });
            }
            return Promise.reject(new Error(`unhandled fetch request: ${url}`));
        });

        // JSDOMのDOMにコンポーネントを追加
        document.body.innerHTML = `
            <gantt-chart-component
                properties-url="config.json"
                data-config-url="config-data.json"
                data-url="schedule-data.json"
                alert-definitions-url="alert-definitions.json"
            ></gantt-chart-component>
        `;
    });

    test('should render the title from config file', async () => {
        const component = document.querySelector('gantt-chart-component');

        // _loadAndRenderが完了するのを待つ
        await new Promise(resolve => setTimeout(resolve, 100)); // 非同期処理を待つための簡単な待機

        const titleElement = component.shadowRoot.querySelector('h1');
        expect(titleElement).not.toBeNull();
        expect(titleElement.textContent).toBe('Test Title');
    });

    test('should override config title with attribute', async () => {
        // 属性でタイトルを上書き
        document.querySelector('gantt-chart-component').setAttribute('title', 'Attribute Title');
        
        const component = document.querySelector('gantt-chart-component');
        await new Promise(resolve => setTimeout(resolve, 100));

        const titleElement = component.shadowRoot.querySelector('h1');
        expect(titleElement.textContent).toBe('Attribute Title');
    });

    test('should call d3 to render a task rect', async () => {
        // タスクを含むスケジュールデータを提供するようにfetchモックを更新
        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('schedule-data.json')) {
                const scheduleData = {
                    equipment: ['EQ1'],
                    items: [
                        { id: 'Task1', type: 'main', equipment: 'EQ1', startTime: '2025-09-26T09:00:00', endTime: '2025-09-26T10:00:00' }
                    ],
                    links: []
                };
                return Promise.resolve({ ok: true, json: () => Promise.resolve(scheduleData) });
            }
            // 他のfetchはデフォルトのままでOK
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        // コンポーネントを再描画
        document.body.innerHTML = '<gantt-chart-component data-url="schedule-data.json"></gantt-chart-component>';

        await new Promise(resolve => setTimeout(resolve, 100));

        // DOM要素の代わりに、D3のappend関数が'rect'で呼び出されたことを確認
        expect(selectionMock.append).toHaveBeenCalledWith('rect');
    });

    test('should toggle side panel on button click', async () => {
        document.body.innerHTML = '<gantt-chart-component></gantt-chart-component>';
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const component = document.querySelector('gantt-chart-component');
        const sidePanel = component.shadowRoot.querySelector('#side-panel');
        const toggleButton = component.shadowRoot.querySelector('#sidebar-toggle-btn');

        // 初期状態は閉じている
        expect(sidePanel.classList.contains('collapsed')).toBe(true);

        // 1回目のクリックで開く
        toggleButton.click();
        expect(sidePanel.classList.contains('collapsed')).toBe(false);

        // 2回目のクリックで閉じる
        toggleButton.click();
        expect(sidePanel.classList.contains('collapsed')).toBe(true);
    });

    test('should open details panel when openPanel is called', async () => {
        // このテスト専用に、タスクを1つ含むデータを提供する
        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('schedule-data.json')) {
                const scheduleData = {
                    equipment: ['EQ1'],
                    items: [
                        { id: 'Task1', type: 'main', equipment: 'EQ1', startTime: '2025-09-26T09:00:00', endTime: '2025-09-26T10:00:00' }
                    ],
                    links: []
                };
                return Promise.resolve({ ok: true, json: () => Promise.resolve(scheduleData) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        document.body.innerHTML = '<gantt-chart-component data-url="schedule-data.json"></gantt-chart-component>';
        await new Promise(resolve => setTimeout(resolve, 100));

        const component = document.querySelector('gantt-chart-component');
        const detailsPanel = component.shadowRoot.querySelector('#details-panel');
        
        // パネルが存在することを確認
        expect(detailsPanel).not.toBeNull();
        // 初期状態ではshowクラスがないことを確認
        expect(detailsPanel.classList.contains('show')).toBe(false);

        // コンポーネントのメソッドを直接呼び出す
        const taskData = { id: 'Task1', description: 'Test Description' };
        component.openPanel(taskData);

        // showクラスが付与されたことを確認
        expect(detailsPanel.classList.contains('show')).toBe(true);
    });

    test('should attach mouseover handler for tooltips', async () => {
        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('schedule-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({
                    equipment: ['EQ1'],
                    items: [{ id: 'T1', alertId: 'A1', equipment: 'EQ1', startTime: '2025-09-26T09:00:00', endTime: '2025-09-26T10:00:00' }],
                    links: []
                }) });
            }
            if (url.endsWith('alert-definitions.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ A1: { icon: '!', description: 'Alert!' } }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        document.body.innerHTML = '<gantt-chart-component data-url="schedule-data.json" alert-definitions-url="alert-definitions.json"></gantt-chart-component>';
        await new Promise(resolve => setTimeout(resolve, 100));

        // ツールチップ用のmouseoverイベントが設定されたか確認
        expect(selectionMock.on).toHaveBeenCalledWith('mouseover', expect.any(Function));
    });

    test('should apply specific style for port tasks', async () => {
        fetch.mockImplementation(url => {
            if (url.endsWith('gantt-chart-component.html')) {
                return Promise.resolve({ ok: true, text: () => Promise.resolve(componentHtml) });
            }
            if (url.endsWith('schedule-data.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({
                    equipment: ['EQ1'],
                    items: [{ id: 'T1', type: 'port-in', equipment: 'EQ1', startTime: '2025-09-26T09:00:00', endTime: '2025-09-26T10:00:00' }],
                    links: []
                }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        document.body.innerHTML = '<gantt-chart-component data-url="schedule-data.json"></gantt-chart-component>';
        await new Promise(resolve => setTimeout(resolve, 100));

        // .style('fill', callback) のコールバック関数を取得
        const fillStyleCall = selectionMock.style.mock.calls.find(call => call[0] === 'fill');
        expect(fillStyleCall).not.toBeUndefined();

        const fillStyleCallback = fillStyleCall[1];
        expect(typeof fillStyleCallback).toBe('function');

        // portタスクのモックデータでコールバックを実行し、戻り値を確認
        const mockPortTask = { type: 'port-in' };
        expect(fillStyleCallback(mockPortTask)).toBe('#A3BFFA');

        // mainタスクの場合、nullが返ることも確認
        const mockMainTask = { type: 'main' };
        expect(fillStyleCallback(mockMainTask)).toBeNull();
    });
});
