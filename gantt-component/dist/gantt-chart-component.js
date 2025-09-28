
class GanttChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Default configuration
        this._config = {
            title: "Gantt Chart",
            initialZoom: 8,
            rowHeight: 50,
            startTime: null,
            endTime: null,
            customLines: [],
            locale: {
                ganttTitle: '生産スケジュール',
                zoomTitle: 'ズーム (時間)',
                zoomUnit: '時間',
                zoom4h: '4時間',
                zoom8h: '8時間',
                zoom12h: '12時間',
                displayRangeTitle: '表示範囲',
                startTimeLabel: '開始:',
                endTimeLabel: '終了:',
                applyTimeRange: '表示範囲を適用',
                displayModeTitle: '表示モード',
                planVsActualButton: '計画対実績モード',
                customLineTitle: 'カスタムライン',
                timeLabel: '時刻:',
                addLineButton: '縦線を追加',
                layoutTitle: 'レイアウト',
                rowHeightLabel: '行の高さ:',
                applyLayout: '適用',
                detailsTitle: 'タスク詳細',
                taskIdLabel: 'タスク ID:',
                jobIdLabel: 'ジョブ ID:',
                typeLabel: 'タイプ:',
                equipmentLabel: '設備:',
                planStartLabel: '計画開始:',
                planEndLabel: '計画終了:',
                actualStartLabel: '実績開始:',
                actualEndLabel: '実績終了:',
                alertLabel: 'アラート:',
                descriptionLabel: '詳細:',
                actualLabelSuffix: 'の実績',
                notAvailable: 'N/A',
            }
        };

        this._data = null;
        this._alertDefinitions = null;
        this.isPlanVsActualMode = false;
    }

    static get observedAttributes() {
        return [
            'properties-url', 'data-config-url', 'data-url', 'alert-definitions-url',
            'title', 'initial-zoom', 'row-height', 'start-time', 'end-time', 'custom-lines'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // If a URL or a direct override attribute changes, reload and re-render
            this._loadAndRender();
        }
    }

    async connectedCallback() {
        const templateResponse = await fetch('/dist/gantt-chart-component.html');
        if (!templateResponse.ok) {
            this.shadowRoot.innerHTML = `<p>Error: Could not load component template.</p>`;
            return;
        }
        const templateContent = await templateResponse.text();
        this.shadowRoot.innerHTML = templateContent;

        // Inject custom styles from slot
        const styleSlot = this.shadowRoot.querySelector('slot[name="custom-styles"]');
        if (styleSlot) {
            const assignedNodes = styleSlot.assignedNodes({ flatten: true });
            assignedNodes.forEach(node => {
                if (node.nodeName === 'STYLE') {
                    this.shadowRoot.prepend(node.cloneNode(true));
                }
            });
        }

        this.initEventListeners();
        this._loadAndRender();
    }

    async _loadAndRender() {
        if (!this.shadowRoot.childElementCount) return;

        const fetchJson = async (url) => {
            if (!url) return null;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Failed to fetch ${url}: ${response.statusText}`);
                    return null;
                }
                return await response.json();
            } catch (error) {
                console.error(`Error fetching ${url}:`, error);
                return null;
            }
        };

        const [propsConfig, dataConfig, scheduleData, alertDefs] = await Promise.all([
            fetchJson(this.getAttribute('properties-url')),
            fetchJson(this.getAttribute('data-config-url')),
            fetchJson(this.getAttribute('data-url')),
            fetchJson(this.getAttribute('alert-definitions-url'))
        ]);

        this._mergeConfigs(propsConfig, dataConfig);
        
        if (scheduleData) {
            this._data = this.parseData(scheduleData);
        }
        if (alertDefs) {
            this._alertDefinitions = alertDefs;
        }

        this._applyUIFromConfig();
        this.render();
    }

    _mergeConfigs(propsConfig, dataConfig) {
        // 1. Start with defaults (already in this._config)
        
        // 2. Merge properties from config.json
        if (propsConfig) {
            this._config.title = propsConfig.title || this._config.title;
            this._config.initialZoom = propsConfig.initialZoom || this._config.initialZoom;
            this._config.rowHeight = propsConfig.rowHeight || this._config.rowHeight;
            if (propsConfig.locale) {
                this._config.locale = { ...this._config.locale, ...propsConfig.locale };
            }
        }

        // 3. Merge data-related properties from config-data.json
        if (dataConfig) {
            this._config.startTime = dataConfig.startTime || this._config.startTime;
            this._config.endTime = dataConfig.endTime || this._config.endTime;
            // Handle customLines being a string or an array
            if (dataConfig.customLines) {
                this._config.customLines = Array.isArray(dataConfig.customLines) ? dataConfig.customLines : [dataConfig.customLines];
            }
        }

        // 4. Override with direct HTML attributes (highest priority)
        this._config.title = this.getAttribute('title') || this._config.title;
        this._config.initialZoom = parseInt(this.getAttribute('initial-zoom'), 10) || this._config.initialZoom;
        this._config.rowHeight = parseInt(this.getAttribute('row-height'), 10) || this._config.rowHeight;
        this._config.startTime = this.getAttribute('start-time') || this._config.startTime;
        this._config.endTime = this.getAttribute('end-time') || this._config.endTime;
        if (this.hasAttribute('custom-lines')) {
            try {
                const lines = JSON.parse(this.getAttribute('custom-lines'));
                this._config.customLines = Array.isArray(lines) ? lines : [lines];
            } catch (e) {
                console.error("Invalid JSON in custom-lines attribute:", e);
            }
        }
    }
    
    _applyUIFromConfig() {
        // Apply locale strings
        this.shadowRoot.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            if (this._config.locale[key]) {
                el.textContent = this._config.locale[key];
            }
        });

        // Set control values from config
        const zoomSlider = this.shadowRoot.getElementById('zoom-slider');
        const zoomValue = this.shadowRoot.getElementById('zoom-value');
        if (zoomSlider) zoomSlider.value = this._config.initialZoom;
        if (zoomValue) zoomValue.textContent = `${this._config.initialZoom}${this._config.locale.zoomUnit}`;

        const rowHeightInput = this.shadowRoot.getElementById('row-height-input');
        if (rowHeightInput) rowHeightInput.value = this._config.rowHeight;
        
        const titleEl = this.shadowRoot.querySelector('#app-header h1');
        if(titleEl) titleEl.textContent = this._config.title;
    }

    parseData(data) {
        const parseDate = (dateStr) => dateStr ? new Date(dateStr) : null;
        const chartItems = data.items.map(item => ({
            ...item,
            startTime: parseDate(item.startTime),
            endTime: parseDate(item.endTime),
            actualStartTime: parseDate(item.actualStartTime),
            actualEndTime: parseDate(item.actualEndTime)
        }));
        return { equipment: data.equipment, chartItems: chartItems, links: data.links };
    }

    initEventListeners() {
        const sidePanel = this.shadowRoot.getElementById('side-panel');
        const toggleBtn = this.shadowRoot.getElementById('sidebar-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            setTimeout(() => this.drawChart(), 300);
        });

        const zoomSlider = this.shadowRoot.getElementById('zoom-slider');
        const zoomValue = this.shadowRoot.getElementById('zoom-value');
        zoomSlider.addEventListener('input', () => {
            const hours = parseInt(zoomSlider.value, 10);
            zoomValue.textContent = `${hours}${this._config.locale.zoomUnit}`;
            this._config.initialZoom = hours;
            this.drawChart();
        });

        this.shadowRoot.querySelectorAll('.zoom-buttons button').forEach(button => {
            button.addEventListener('click', (event) => {
                const zoomHours = parseInt(event.target.dataset.zoom, 10);
                zoomSlider.value = zoomHours;
                zoomValue.textContent = `${zoomHours}${this._config.locale.zoomUnit}`;
                this._config.initialZoom = zoomHours;
                this.drawChart();
            });
        });

        const redisplayButton = this.shadowRoot.getElementById('redisplay-button');
        redisplayButton.addEventListener('click', () => {
            const startTimeInput = this.shadowRoot.getElementById('start-time-input');
            const endTimeInput = this.shadowRoot.getElementById('end-time-input');
            this.setRange(startTimeInput.value, endTimeInput.value);
        });


        const planVsActualButton = this.shadowRoot.getElementById('plan-vs-actual-button');
        planVsActualButton.addEventListener('click', () => {
            this.isPlanVsActualMode = !this.isPlanVsActualMode;
            planVsActualButton.classList.toggle('active', this.isPlanVsActualMode);
            this.drawChart();
        });

        const applyLayoutButton = this.shadowRoot.getElementById('apply-layout-button');
        applyLayoutButton.addEventListener('click', () => {
            const rowHeightInput = this.shadowRoot.getElementById('row-height-input');
            this._config.rowHeight = parseInt(rowHeightInput.value, 10);
            this.drawChart();
        });
        
        const detailsPanel = this.shadowRoot.getElementById('details-panel');
        const detailsOverlay = this.shadowRoot.getElementById('details-panel-overlay');
        detailsOverlay.addEventListener('click', () => this.closePanel());

        const chartArea = this.shadowRoot.getElementById('gantt-chart-area');
        const xAxis = this.shadowRoot.getElementById('gantt-x-axis');
        const yAxis = this.shadowRoot.getElementById('gantt-y-axis');
        chartArea.addEventListener('scroll', () => {
            xAxis.scrollLeft = chartArea.scrollLeft;
            yAxis.scrollTop = chartArea.scrollTop;
        });
    }

    render() {
        if (this._data && this._alertDefinitions) {
            this.loadD3().then(() => {
                this.drawChart();
            });
        }
    }
    
    // Public method to dynamically set the time range
    setRange(startTime, endTime) {
        this._config.startTime = startTime;
        this._config.endTime = endTime;
        this.drawChart();
    }

    loadD3() {
        return new Promise((resolve, reject) => {
            if (window.d3) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = "https://d3js.org/d3.v7.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }


    drawChart() {
        if (!this._data) return;

        const { equipment, chartItems, links } = this._data;
        const { rowHeight, initialZoom, locale } = this._config;
        
        const finalItems = this.assignLanes(this.assignActualLanes(chartItems.filter(d => d.startTime && d.endTime)));
        const itemsById = new Map(finalItems.map(d => [d.id, d]));

        const xAxisContainer = this.shadowRoot.getElementById("gantt-x-axis");
        const yAxisContainer = this.shadowRoot.getElementById("gantt-y-axis");
        const chartAreaContainer = this.shadowRoot.getElementById("gantt-chart-area");

        d3.select(xAxisContainer).selectAll("*").remove();
        d3.select(yAxisContainer).selectAll("*").remove();
        d3.select(chartAreaContainer).selectAll("*").remove();

        const equipmentWithActuals = this.isPlanVsActualMode 
            ? equipment.flatMap(e => [e, `${e}${locale.actualLabelSuffix}`]) 
            : equipment;

        const chartHeight = rowHeight * equipmentWithActuals.length;
        const margin = { top: 50, right: 30, bottom: 20, left: 100 };
        const height = chartHeight;
        const portHeight = 12;

        let domainMin = this._config.startTime ? new Date(this._config.startTime) : d3.min(chartItems, d => d.startTime);
        let domainMax = this._config.endTime ? new Date(this._config.endTime) : d3.max(chartItems, d => d.endTime);
        
        if (!domainMin || !domainMax) {
            domainMin = new Date();
            domainMax = d3.timeDay.offset(domainMin, 1);
        }

        const totalDurationMs = domainMax.getTime() - domainMin.getTime();
        const totalDurationHours = totalDurationMs / (1000 * 60 * 60);
        const standardViewportWidth = 800;
        const pixelsPerHour = standardViewportWidth / initialZoom;
        const finalChartWidth = Math.max(totalDurationHours * pixelsPerHour, standardViewportWidth);

        const yScale = d3.scaleBand().domain(equipmentWithActuals).range([0, height]).padding(0.2);
        const xScale = d3.scaleTime().domain([domainMin, domainMax]).range([0, finalChartWidth]);

        const formatForInput = (date) => {
            if (!date) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        this.shadowRoot.getElementById('start-time-input').value = formatForInput(domainMin);
        this.shadowRoot.getElementById('end-time-input').value = formatForInput(domainMax);

        const xAxisSvg = d3.select(xAxisContainer).append("svg").attr("width", finalChartWidth).attr("height", margin.top);
        const xAxisGroup = xAxisSvg.append("g").attr("transform", `translate(0, ${margin.top})`);
        const dayAxis = xAxisGroup.append("g").attr("class", "x-axis-day axis").attr("transform", `translate(0,-30)`).call(d3.axisTop(xScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%m/%d")));
        dayAxis.selectAll("line").remove();
        xAxisGroup.append("text").attr("class", "top-left-date").attr("x", 10).attr("y", -35).text(d3.timeFormat("%m/%d")(domainMin));
        xAxisGroup.append("g").attr("class", "x-axis-time axis").call(d3.axisTop(xScale).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M")));

        const yAxisSvg = d3.select(yAxisContainer).append("svg").attr("width", margin.left).attr("height", height + margin.top + margin.bottom);
        const yAxisGroup = yAxisSvg.append("g").attr("class", "y-axis axis").attr("transform", `translate(${margin.left}, ${margin.top})`).call(d3.axisLeft(yScale));
        yAxisGroup.select(".domain").remove();

        const chartBodySvg = d3.select(chartAreaContainer).append("svg").attr("width", finalChartWidth).attr("height", height + margin.top + margin.bottom);
        const svg = chartBodySvg.append("g")
            .attr("transform", `translate(0, ${margin.top})`);

        const defs = svg.append('defs');

        const colorMap = {
            'managed-color-blue': { fill: '#60A5FA', stroke: '#2563EB' },
            'managed-color-red': { fill: '#F87171', stroke: '#DC2626' },
            'managed-color-green': { fill: '#4ADE80', stroke: '#16A34A' },
            'managed-color-yellow': { fill: '#FACC15', stroke: '#CA8A04' },
        };
        const defaultFillColor = '#818CF8'; // from .main-rect

        finalItems.forEach(item => {
            const options = item.options || [];
            if (options.includes('managed-pattern-stripes')) {
                const colorOption = options.find(o => colorMap[o]);
                const backgroundColor = colorOption ? colorMap[colorOption].fill : defaultFillColor;
                const patternId = `managed-pattern-stripes-${backgroundColor.replace('#', '')}`;
                item.patternId = patternId;

                if (!defs.select(`#${patternId}`).empty()) return;

                const pattern = defs.append('pattern')
                    .attr('id', patternId)
                    .attr('patternUnits', 'userSpaceOnUse')
                    .attr('width', 6)
                    .attr('height', 6)
                    .attr('patternTransform', 'rotate(45)');

                pattern.append('rect')
                    .attr('width', 6)
                    .attr('height', 6)
                    .attr('fill', backgroundColor);
                
                pattern.append('path')
                    .attr('d', 'M 0,0 V 6')
                    .style('stroke', '#4B5563')
                    .style('stroke-width', 2.5);
            }
        });

        // Inject slotted SVG defs
        const defsSlot = this.shadowRoot.querySelector('slot[name="svg-defs"]');
        if (defsSlot) {
            const assignedNodes = defsSlot.assignedNodes({ flatten: true });
            if (assignedNodes.length > 0) {
                assignedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        defs.node().appendChild(node.cloneNode(true));
                    }
                });
            }
        }

        svg.append("g").attr("class", "grid-lines").attr("transform", `translate(0, ${-margin.top})`).call(d3.axisTop(xScale).ticks(d3.timeMinute.every(30)).tickSize(-(height + margin.top + margin.bottom)).tickFormat(""));

        const itemGroups = svg.append("g").selectAll("g").data(finalItems).join("g").attr("class", "item-group").on("click", (event, d) => this.openPanel(d));

        const maxLanesByEquipment = new Map();
        equipment.forEach(eq => {
            const maxLane = d3.max(finalItems.filter(i => i.equipment === eq), i => i.lane);
            maxLanesByEquipment.set(eq, (maxLane === undefined ? 0 : maxLane) + 1);
        });

        itemGroups.append("rect")
            .attr("class", d => `planned-bar ${d.type}-rect ` + (d.options ? d.options.join(' ') : ''))
            .attr("x", d => xScale(d.startTime))
            .attr("y", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment) || 1;
                const laneHeight = yScale.bandwidth() / numLanes;
                const yPos = yScale(d.equipment) + (d.lane * laneHeight);
                return d.type.startsWith('port') ? yPos + (laneHeight - portHeight) / 2 : yPos;
            })
            .attr("width", d => Math.max(0, xScale(d.endTime) - xScale(d.startTime)))
            .attr("height", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment) || 1;
                const laneHeight = yScale.bandwidth() / numLanes;
                return d.type.startsWith('port') ? portHeight : laneHeight;
            })
            .attr("rx", 2).attr("ry", 2)
            .each(function(d) {
                const rect = d3.select(this);
                const options = d.options || [];

                // Default styles from CSS will apply first
                rect.style('fill', null).style('stroke', null).style('stroke-width', null).style('stroke-dasharray', null);

                const colorOption = options.find(o => colorMap[o]);
                if (colorOption) {
                    rect.style('fill', colorMap[colorOption].fill);
                    rect.style('stroke', colorMap[colorOption].stroke);
                }

                // Pattern fill
                if (d.patternId) {
                    rect.style('fill', `url(#${d.patternId})`);
                }

                // Port-specific styles (overrides others)
                if (d.type.startsWith('port')) {
                    rect.style('fill', '#A3BFFA');
                    rect.style('stroke', '#5A67D8');
                }

                // Managed Borders
                if (options.includes('managed-border-thick')) {
                    rect.style('stroke-width', '2px');
                }
                if (options.includes('managed-border-dashed')) {
                    rect.style('stroke-dasharray', '4, 4');
                }
            });

        if (this.isPlanVsActualMode) {
            const maxActualLanesByEquipment = new Map();
            equipment.forEach(eq => {
                const maxLane = d3.max(chartItems.filter(i => i.equipment === eq && i.actualLane !== undefined), i => i.actualLane);
                maxActualLanesByEquipment.set(eq, (maxLane === undefined ? 0 : maxLane) + 1);
            });
            itemGroups.filter(d => d.actualStartTime).append("rect")
                .attr("class", "actual-bar")
                .attr("x", d => xScale(d.actualStartTime))
                .attr("y", d => {
                    const numLanes = maxActualLanesByEquipment.get(d.equipment) || 1;
                    const laneHeight = yScale.bandwidth() / numLanes;
                    return yScale(`${d.equipment}${locale.actualLabelSuffix}`) + (d.actualLane * laneHeight);
                })
                .attr("width", d => Math.max(0, xScale(d.actualEndTime || new Date()) - xScale(d.actualStartTime)))
                .attr("height", d => (yScale.bandwidth() / (maxActualLanesByEquipment.get(d.equipment) || 1)));
        }

        itemGroups.append("text").attr("class", "task-label").attr("x", d => xScale(d.startTime) + 6)
            .attr("y", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment) || 1;
                const laneHeight = yScale.bandwidth() / numLanes;
                return yScale(d.equipment) + (d.lane * laneHeight) + (laneHeight / 2);
            })
            .attr("dy", "0.35em").text(d => d.id);

        svg.append("g").attr("class", "links").selectAll("line").data(links).join("line")
            .attr("class", "link-line") // Base class
            .each(function(d) {
                const sourceItem = itemsById.get(d.source);
                const targetItem = itemsById.get(d.target);
                if (!sourceItem || !targetItem) {
                    d3.select(this).remove();
                    return;
                };

                const getTaskCenterY = (item) => {
                    const numLanes = maxLanesByEquipment.get(item.equipment) || 1;
                    const laneHeight = yScale.bandwidth() / numLanes;
                    return yScale(item.equipment) + (item.lane * laneHeight) + (laneHeight / 2);
                };

                const line = d3.select(this)
                    .attr("x1", xScale(sourceItem.endTime))
                    .attr("y1", getTaskCenterY(sourceItem))
                    .attr("x2", xScale(targetItem.startTime))
                    .attr("y2", getTaskCenterY(targetItem));
                
                // Apply managed options for links
                const options = d.options || [];
                const linkColorMap = {
                    'managed-link-color-red': '#DC2626',
                    'managed-link-color-green': '#16A34A',
                };

                const colorOption = options.find(o => linkColorMap[o]);
                if (colorOption) {
                    line.style('stroke', linkColorMap[colorOption]);
                }

                if (options.includes('managed-link-style-dashed')) {
                    line.style('stroke-dasharray', '4, 4');
                } else if (options.includes('managed-link-style-solid')) {
                    line.style('stroke-dasharray', 'none');
                }

                const weightMap = {
                    'managed-link-weight-bold': '3px',
                    'managed-link-weight-medium': '1.5px',
                    'managed-link-weight-thin': '0.5px',
                };
                const weightOption = options.find(o => weightMap[o]);
                if (weightOption) {
                    line.style('stroke-width', weightMap[weightOption]);
                }
            });

        const now = new Date();
        if (now >= domainMin && now <= domainMax) {
            svg.append("line").attr("class", "current-time-line").attr("x1", xScale(now)).attr("x2", xScale(now)).attr("y1", -margin.top).attr("y2", height + margin.bottom).attr("stroke-width", 2).attr("stroke-dasharray", "4 4");
        }

        this._config.customLines.map(l => new Date(l)).forEach(lineTime => {
            if (lineTime >= domainMin && lineTime <= domainMax) {
                svg.append("line").attr("class", "custom-time-line").attr("x1", xScale(lineTime)).attr("x2", xScale(lineTime)).attr("y1", -margin.top).attr("y2", height + margin.bottom).attr("stroke-width", 2).attr("stroke-dasharray", "8 4");
            }
        });
        
        const tooltip = svg.append("g").attr("class", "gantt-tooltip").style("opacity", 0);
        tooltip.append("rect").attr("width", 180).attr("height", 30).attr("fill", "black").attr("rx", 5);
        tooltip.append("text").attr("x", 10).attr("y", 20).attr("fill", "white").style("font-size", "12px");
        itemGroups.filter(d => d.alertId && this._alertDefinitions[d.alertId]).append("text")
            .attr("class", "alert-icon")
            .attr("text-anchor", "end") // Anchor to the end of the text
            .attr("x", d => xScale(d.endTime) - 4) // Position icon just inside the right edge
            .attr("y", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment) || 1;
                const laneHeight = yScale.bandwidth() / numLanes;
                // Center vertically in the middle of the lane
                return yScale(d.equipment) + (d.lane * laneHeight) + (laneHeight / 2);
            })
            .attr("dominant-baseline", "central") // Center the icon vertically
            .text(d => this._alertDefinitions[d.alertId].icon || '⚠️')
            .on("mouseover", (event, d) => {
                const alertDef = this._alertDefinitions[d.alertId];
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.select("text").text(alertDef.description);
                tooltip.attr("transform", `translate(${xScale(d.startTime) + 10},${yScale(d.equipment) - 35})`);
            })
            .on("mouseout", () => {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }
    
    openPanel(taskData) {
        const detailsPanel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('details-panel-overlay');
        const l = this._config.locale;
        
        const formatPanelDate = (date) => date ? date.toLocaleString('ja-JP') : l.notAvailable;

        let content = `<div class="panel-header"><h2>${l.detailsTitle}</h2><span class="close-button">&times;</span></div>`;
        content += `<div class="panel-content">
            <p><strong>${l.taskIdLabel}</strong> <span>${taskData.id || l.notAvailable}</span></p>
            <p><strong>${l.jobIdLabel}</strong> <span>${taskData.jobId || l.notAvailable}</span></p>
            <p><strong>${l.typeLabel}</strong> <span>${taskData.type || l.notAvailable}</span></p>
            <p><strong>${l.equipmentLabel}</strong> <span>${taskData.equipment || l.notAvailable}</span></p>
            <p><strong>${l.planStartLabel}</strong> <span>${formatPanelDate(taskData.startTime)}</span></p>
            <p><strong>${l.planEndLabel}</strong> <span>${formatPanelDate(taskData.endTime)}</span></p>
        `;
        if(taskData.actualStartTime) content += `<p><strong>${l.actualStartLabel}</strong> <span>${formatPanelDate(taskData.actualStartTime)}</span></p>`;
        if(taskData.actualEndTime) content += `<p><strong>${l.actualEndLabel}</strong> <span>${formatPanelDate(taskData.actualEndTime)}</span></p>`;
        if(taskData.alertId && this._alertDefinitions[taskData.alertId]) content += `<p><strong>${l.alertLabel}</strong> <span>${this._alertDefinitions[taskData.alertId].description}</span></p>`;
        if(taskData.description) content += `<p><strong>${l.descriptionLabel}</strong> <span>${taskData.description}</span></p>`;
        content += `</div>`;
        
        detailsPanel.innerHTML = content;
        detailsPanel.classList.add('show');
        overlay.classList.add('show');
        detailsPanel.querySelector('.close-button').addEventListener('click', () => this.closePanel());
    }

    closePanel() {
        this.shadowRoot.getElementById('details-panel').classList.remove('show');
        this.shadowRoot.getElementById('details-panel-overlay').classList.remove('show');
    }

    // Lane assignment logic - unchanged
    assignLanes(items) {
        const itemsByEquipment = d3.group(items, d => d.equipment);
        itemsByEquipment.forEach(equipmentItems => {
            const lanes = [];
            equipmentItems.sort((a, b) => a.startTime - b.startTime);
            equipmentItems.forEach(item => {
                item.lane = 0;
                let assigned = false;
                for (let i = 0; i < lanes.length; i++) {
                    if (lanes[i] <= item.startTime) {
                        lanes[i] = item.endTime;
                        item.lane = i;
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) {
                    item.lane = lanes.length;
                    lanes.push(item.endTime);
                }
            });
        });
        return items;
    }
    assignActualLanes(items) {
        const itemsByEquipment = d3.group(items.filter(i => i.actualStartTime), d => d.equipment);
        itemsByEquipment.forEach(equipmentItems => {
            const lanes = [];
            equipmentItems.sort((a, b) => a.actualStartTime - b.actualStartTime);
            equipmentItems.forEach(item => {
                item.actualLane = 0;
                let assigned = false;
                for (let i = 0; i < lanes.length; i++) {
                    if (lanes[i] <= item.actualStartTime) {
                        lanes[i] = item.actualEndTime || new Date();
                        item.actualLane = i;
                        assigned = true;
                        break;
                    }
                }
                if (!assigned) {
                    item.actualLane = lanes.length;
                    lanes.push(item.actualEndTime || new Date());
                }
            });
        });
        return items;
    }
}
customElements.define('gantt-chart-component', GanttChartComponent);
