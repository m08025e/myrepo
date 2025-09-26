
class GanttChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = null;
        this.currentZoom = 'all';
        this._customLines = [];
    }

    static get observedAttributes() {
        return ['data-url', 'start-time', 'end-time'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'data-url' && oldValue !== newValue) {
            this.fetchData(newValue);
        }
        if ((name === 'start-time' || name === 'end-time') && oldValue !== newValue) {
            this.render();
        }
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this._data = this.parseData(data);
            this.render();
        } catch (error) {
            console.error("Error fetching data:", error);
            this.shadowRoot.innerHTML = `<p>Error loading data: ${error.message}</p>`;
        }
    }

    parseData(data) {
        const parseDate = (dateStr) => dateStr ? new Date(dateStr) : null;

        const chartItems = data.items.map(item => ({
            ...item,
            startTime: parseDate(item.startTime),
            endTime: parseDate(item.endTime)
        }));

        return {
            equipment: data.equipment,
            chartItems: chartItems,
            links: data.links
        };
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                :host {
                    --primary-color: #5A67D8;
                    --primary-color-light: #E0E5F9;
                    --background-color: #F7FAFC;
                    --text-color-dark: #2D3748;
                    --text-color-light: #718096;
                    --border-color: #EDF2F7;
                    --shadow-color: rgba(0, 0, 0, 0.05);
                    --shadow-color-lg: rgba(0, 0, 0, 0.1);

                    display: block;
                    font-family: 'Inter', sans-serif;
                    background-color: var(--background-color);
                    color: var(--text-color-dark);
                    padding: 2rem;
                }

                h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                }

                .controls {
                    margin-bottom: 1.5rem;
                    display: flex;
                    gap: 0.75rem;
                }

                .controls button {
                    padding: 0.6rem 1.2rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background-color: white;
                    color: var(--text-color-light);
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    box-shadow: 0 1px 2px var(--shadow-color);
                }

                .controls button:hover {
                    color: var(--primary-color);
                    border-color: var(--primary-color-light);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px var(--shadow-color-lg);
                }

                .controls button.active {
                    background-color: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .time-range-controls {
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .time-range-controls label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-color-light);
                }

                .time-range-controls input {
                    font-family: 'Inter', sans-serif;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background-color: white;
                    color: var(--text-color-dark);
                }

                .custom-line-controls {
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .custom-line-controls label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text-color-light);
                }

                .custom-line-controls input {
                    font-family: 'Inter', sans-serif;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background-color: white;
                    color: var(--text-color-dark);
                }

                #redisplay-button, #add-line-button {
                    padding: 0.6rem 1.2rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    border: 1px solid var(--border-color);
                    border-radius: 0.5rem;
                    background-color: white;
                    color: var(--text-color-light);
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                    box-shadow: 0 1px 2px var(--shadow-color);
                }

                #redisplay-button:hover, #add-line-button:hover {
                    color: var(--primary-color);
                    border-color: var(--primary-color-light);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px var(--shadow-color-lg);
                }

                .chart-scroll-container {
                    width: 100%;
                    border: 1px solid var(--border-color);
                    border-radius: 0.75rem;
                    overflow-x: auto;
                    background-color: white;
                    box-shadow: 0 4px 12px var(--shadow-color-lg);
                    padding: 1rem;
                }

                .svg-container {
                    font-size: 0.8rem;
                }

                .item-group {
                    cursor: pointer;
                }

                .pre-rect, .main-rect, .post-rect, .port-rect {
                    transition: filter 0.2s ease-in-out;
                }

                .item-group:hover .pre-rect, 
                .item-group:hover .main-rect, 
                .item-group:hover .post-rect,
                .item-group:hover .port-rect {
                    filter: brightness(1.1);
                }

                .pre-rect  { fill: #A3BFFA; stroke: #5A67D8; stroke-width: 1; }
                .main-rect { fill: #829FD9; stroke: #4C5AD9; stroke-width: 1; }
                .post-rect { fill: #C2D2F2; stroke: #829FD9; stroke-width: 1; }
                .port-rect { fill: #D6BCFA; stroke: #9F7AEA; stroke-width: 1; }

                .link-line {
                    stroke: var(--text-color-light);
                    stroke-width: 1.5;
                    fill: none;
                    stroke-dasharray: 3 3;
                }

                .axis line, .axis path {
                    stroke: var(--border-color);
                    stroke-width: 0.5;
                }

                .axis text {
                    fill: var(--text-color-light);
                    font-size: 0.75rem;
                }

                .x-axis .domain { display: none; }
                .y-axis .domain { display: none; }
                .y-axis .tick line { display: none; }
                .y-axis .tick text { font-weight: 600; }

                .grid-lines line {
                    stroke: var(--border-color);
                    stroke-dasharray: 2 2;
                }

                .grid-lines path { stroke-width: 0; }

                .task-label {
                    font-size: 0.7rem;
                    fill: var(--text-color-dark);
                    font-weight: 600;
                    pointer-events: none;
                }

                .panel-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(4px);
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    z-index: 999;
                }

                .panel-overlay.show {
                    opacity: 1;
                    visibility: visible;
                }

                #details-panel {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 380px;
                    height: 100%;
                    background-color: white;
                    box-shadow: -10px 0 25px rgba(0,0,0,0.1);
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                }

                #details-panel.show {
                    transform: translateX(0);
                }

                .panel-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .panel-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .panel-header .close-button {
                    font-size: 1.5rem;
                    color: var(--text-color-light);
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                .panel-header .close-button:hover {
                    color: var(--text-color-dark);
                }

                .panel-content {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex-grow: 1;
                }

                .panel-content p {
                    margin: 0 0 1rem 0;
                    display: flex;
                    font-size: 0.875rem;
                }

                .panel-content strong {
                    flex-shrink: 0;
                    width: 90px;
                    color: var(--text-color-light);
                    font-weight: 500;
                }

                .panel-content span {
                    font-weight: 600;
                    color: var(--text-color-dark);
                }

                /* Background Colors */
                .bg-blue { fill: #93C5FD; }
                .bg-red { fill: #FCA5A5; }
                .bg-yellow { fill: #FCD34D; }
                .bg-green { fill: #6EE7B7; }

                /* Border Colors */
                .border-blue { stroke: #3B82F6; }
                .border-red { stroke: #EF4444; }
                .border-yellow { stroke: #F59E0B; }
                .border-green { stroke: #10B981; }

                /* Border Widths */
                .border-sm { stroke-width: 1; }
                .border-md { stroke-width: 2; }
                .border-lg { stroke-width: 4; }
            </style>
            <h1>生産スケジュール</h1>
            <div class="controls">
                <button id="zoom-1h">1時間</button>
                <button id="zoom-4h">4時間</button>
                <button id="zoom-8h">8時間</button>
                <button id="zoom-all" class="active">全体</button>
            </div>
            <div class="time-range-controls">
                <label for="start-time">開始:</label>
                <input type="datetime-local" id="start-time-input">
                <label for="end-time">終了:</label>
                <input type="datetime-local" id="end-time-input">
                <button id="redisplay-button">再表示</button>
            </div>
            <div class="custom-line-controls">
                <label for="custom-line-time">時刻:</label>
                <input type="datetime-local" id="custom-line-time-input">
                <button id="add-line-button">縦線を追加</button>
            </div>
            <div id="chart" class="chart-scroll-container"></div>
        
            <div id="panel-overlay" class="panel-overlay"></div>
            <div id="details-panel">
                <div class="panel-header">
                    <h2>タスク詳細</h2>
                    <span class="close-button">&times;</span>
                </div>
                <div class="panel-content" id="panel-details">
                </div>
            </div>
        `;

        const dataUrl = this.getAttribute('data-url');
        if (dataUrl) {
            this.fetchData(dataUrl);
        }

        this.initEventListeners();
    }

    initEventListeners() {
        const controls = this.shadowRoot.querySelector('.controls');
        controls.addEventListener("click", (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.shadowRoot.querySelectorAll(".controls button").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                const id = e.target.id;
                if (id === "zoom-1h") this.currentZoom = 1;
                else if (id === "zoom-4h") this.currentZoom = 4;
                else if (id === "zoom-8h") this.currentZoom = 8;
                else if (id === "zoom-all") this.currentZoom = 'all';

                this.removeAttribute('start-time');
                this.removeAttribute('end-time');

                this.drawChart(this.currentZoom);
            }
        });

        const redisplayButton = this.shadowRoot.getElementById('redisplay-button');
        redisplayButton.addEventListener('click', () => {
            const startTimeInput = this.shadowRoot.getElementById('start-time-input');
            const endTimeInput = this.shadowRoot.getElementById('end-time-input');
            this.setAttribute('start-time', startTimeInput.value);
            this.setAttribute('end-time', endTimeInput.value);
        });

        const addLineButton = this.shadowRoot.getElementById('add-line-button');
        addLineButton.addEventListener('click', () => {
            const customLineTimeInput = this.shadowRoot.getElementById('custom-line-time-input');
            const time = customLineTimeInput.value;
            if (time) {
                this._customLines.push(new Date(time));
                this.drawChart(this.currentZoom);
            }
        });

        const panel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('panel-overlay');
        const closePanelButton = panel.querySelector('.close-button');

        closePanelButton.addEventListener('click', () => this.closePanel());
        overlay.addEventListener('click', () => this.closePanel());

        window.addEventListener('resize', () => { this.drawChart(this.currentZoom); });
    }

    render() {
        if (this._data) {
            this.loadD3().then(() => {
                this.drawChart(this.currentZoom);
            });
        }
    }

    loadD3() {
        return new Promise((resolve, reject) => {
            if (window.d3) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = "https://d3js.org/d3.v7.min.js";
            script.onload = () => {
                const timeFormatScript = document.createElement('script');
                timeFormatScript.src = "https://d3js.org/d3-time-format.v3.min.js";
                timeFormatScript.onload = resolve;
                timeFormatScript.onerror = reject;
                document.head.appendChild(timeFormatScript);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    drawChart(timeSpan) {
        if (!this._data) return;

        const { equipment, chartItems, links } = this._data;
        const itemsById = new Map(chartItems.map(d => [d.id, d]));

        const chartContainer = this.shadowRoot.getElementById("chart");
        d3.select(chartContainer).selectAll("svg").remove();

        const container = d3.select(chartContainer).node();
        const visibleWidth = container.getBoundingClientRect().width - 30;
        
        const margin = { top: 20, right: 30, bottom: 40, left: 80 };
        const height = 300 - margin.top - margin.bottom;
        
        const svgTotalWidth = 1800;
        const width = svgTotalWidth - margin.left - margin.right;
        
        const portHeight = 12;
        const rowPadding = 0.4;

        const yScale = d3.scaleBand().domain(equipment).range([0, height]).padding(rowPadding);
        const xScale = d3.scaleTime().range([0, width]);

        const startTimeAttr = this.getAttribute('start-time');
        const endTimeAttr = this.getAttribute('end-time');

        let domainMin, domainMax;

        if (startTimeAttr && endTimeAttr) {
            domainMin = new Date(startTimeAttr);
            domainMax = new Date(endTimeAttr);
        } else if (timeSpan === 'all') {
            domainMin = d3.min(chartItems, d => d.startTime);
            domainMax = d3.max(chartItems, d => d.endTime);
        } else {
            const minTimeGlobal = d3.min(chartItems, d => d.startTime);
            domainMin = minTimeGlobal;
            domainMax = new Date(domainMin.getTime() + timeSpan * 60 * 60 * 1000);
        }
        xScale.domain([domainMin, domainMax]).nice();

        const formatForInput = (date) => {
            if (!date) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        this.shadowRoot.getElementById('start-time-input').value = formatForInput(domainMin);
        this.shadowRoot.getElementById('end-time-input').value = formatForInput(domainMax);

        const svg = d3.select(chartContainer).append("svg")
            .attr("class", "svg-container")
            .attr("width", svgTotalWidth)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        const defs = svg.append('defs');
        
        const patternVStripe = defs.append('pattern')
            .attr('id', 'pattern-v-stripe')
            .attr('width', 4)
            .attr('height', 4)
            .attr('patternUnits', 'userSpaceOnUse');
        patternVStripe.append('path')
            .attr('d', 'M 2 0 L 2 4')
            .attr('stroke', '#60A5FA')
            .attr('stroke-width', 2);

        const patternHStripe = defs.append('pattern')
            .attr('id', 'pattern-h-stripe')
            .attr('width', 4)
            .attr('height', 4)
            .attr('patternUnits', 'userSpaceOnUse');
        patternHStripe.append('path')
            .attr('d', 'M 0 2 L 4 2')
            .attr('stroke', '#60A5FA')
            .attr('stroke-width', 2);

        const patternDStripe = defs.append('pattern')
            .attr('id', 'pattern-d-stripe')
            .attr('width', 4)
            .attr('height', 4)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)');
        patternDStripe.append('path')
            .attr('d', 'M 0 2 L 4 2')
            .attr('stroke', '#60A5FA')
            .attr('stroke-width', 2);

        const tickInterval = (timeSpan === 1) ? 5 : (timeSpan === 4 ? 15 : 30);
        
        svg.append("g").attr("class", "grid-lines")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(d3.timeMinute.every(tickInterval)).tickSize(-height).tickFormat(""));
        
        svg.append("g").attr("class", "x-axis axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(d3.timeMinute.every(tickInterval)).tickFormat(d3.timeFormat("%H:%M")));
        
        svg.append("g").attr("class", "y-axis axis")
            .call(d3.axisLeft(yScale));

        const itemGroups = svg.append("g")
            .selectAll("g")
            .data(chartItems)
            .join("g")
            .attr("class", "item-group")
            .on("click", (event, d) => {
                this.openPanel(d);
            });

        itemGroups.append("rect")
            .attr("class", d => {
                let baseClass = d.type.startsWith('port') ? 'port-rect' : `${d.type}-rect`;
                if (d.options) {
                    d.options.forEach(opt => {
                        baseClass += ` ${opt}`;
                    });
                }
                return baseClass;
            })
            .attr("x", d => xScale(d.startTime))
            .attr("y", d => d.type.startsWith('port') ? yScale(d.equipment) + (yScale.bandwidth() / 2) - portHeight / 2 : yScale(d.equipment))
            .attr("width", d => Math.max(0, xScale(d.endTime) - xScale(d.startTime)))
            .attr("height", d => d.type.startsWith('port') ? portHeight : yScale.bandwidth())
            .attr("rx", 2)
            .attr("ry", 2)
            .style("fill", d => {
                if (d.options) {
                    if (d.options.includes('pattern-v-stripe')) return 'url(#pattern-v-stripe)';
                    if (d.options.includes('pattern-h-stripe')) return 'url(#pattern-h-stripe)';
                    if (d.options.includes('pattern-d-stripe')) return 'url(#pattern-d-stripe)';
                }
                return null;
            });

        itemGroups.append("text")
            .attr("class", "task-label")
            .attr("x", d => xScale(d.startTime) + 6)
            .attr("y", d => yScale(d.equipment) + (yScale.bandwidth() / 2))
            .attr("dy", "0.35em")
            .text(d => d.id)
            .each(function(d) {
                const rectWidth = Math.max(0, xScale(d.endTime) - xScale(d.startTime));
                if (this.getBBox().width + 12 > rectWidth) {
                    d3.select(this).style("display", "none");
                }
            });
        
        svg.append("g").attr("class", "links")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "link-line")
            .each(function(d) {
                const sourceItem = itemsById.get(d.source);
                const targetItem = itemsById.get(d.target);
                if (!sourceItem || !targetItem) return;
                const x1 = xScale(sourceItem.endTime);
                const y1 = yScale(sourceItem.equipment) + yScale.bandwidth() / 2;
                const x2 = xScale(targetItem.startTime);
                const y2 = yScale(targetItem.equipment) + yScale.bandwidth() / 2;
                d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
            });

        const now = new Date();
        if (now >= domainMin && now <= domainMax) {
            svg.append("line")
                .attr("class", "current-time-line")
                .attr("x1", xScale(now))
                .attr("x2", xScale(now))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4 4");
        }

        this._customLines.forEach(lineTime => {
            if (lineTime >= domainMin && lineTime <= domainMax) {
                svg.append("line")
                    .attr("class", "custom-time-line")
                    .attr("x1", xScale(lineTime))
                    .attr("x2", xScale(lineTime))
                    .attr("y1", 0)
                    .attr("y2", height)
                    .attr("stroke", "purple")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "8 4");
            }
        });
    }

    openPanel(taskData) {
        const panel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('panel-overlay');
        const panelDetailsContainer = this.shadowRoot.getElementById('panel-details');

        const formatDateTime = (date) => {
            if (!date) return 'N/A';
            return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        
        panelDetailsContainer.innerHTML = `
            <p><strong>タスク ID:</strong> <span>${taskData.id}</span></p>
            <p><strong>ジョブ ID:</strong> <span>${taskData.jobId}</span></p>
            <p><strong>タイプ:</strong> <span>${taskData.type}</span></p>
            <p><strong>設備:</strong> <span>${taskData.equipment}</span></p>
            <p><strong>開始日時:</strong> <span>${formatDateTime(taskData.startTime)}</span></p>
            <p><strong>終了日時:</strong> <span>${formatDateTime(taskData.endTime)}</span></p>
            <p><strong>オプション:</strong> <span>${taskData.options ? taskData.options.join(', ') : 'なし'}</span></p>
        `;
        panel.classList.add('show');
        overlay.classList.add('show');
    }

    closePanel() {
        const panel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('panel-overlay');
        panel.classList.remove('show');
        overlay.classList.remove('show');
    }
}

customElements.define('gantt-chart-component', GanttChartComponent);
