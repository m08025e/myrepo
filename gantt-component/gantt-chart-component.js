class GanttChartComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = null;
        this._alertDefinitions = null;
        this.currentZoom = 8;
        this._customLines = [];
        this.isPlanVsActualMode = false;
    }

    static get observedAttributes() {
        return ['data-url', 'alert-definitions-url', 'start-time', 'end-time', 'row-height'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if ((name === 'data-url' || name === 'alert-definitions-url') && (oldValue !== newValue)) {
            this.fetchAllData();
        }
        if ((name === 'start-time' || name === 'end-time' || name === 'row-height') && oldValue !== newValue) {
            this.render();
        }
    }

    async fetchAllData() {
        const dataUrl = this.getAttribute('data-url');
        const alertsUrl = this.getAttribute('alert-definitions-url');
        if (!dataUrl || !alertsUrl) return;

        try {
            const [dataResponse, alertsResponse] = await Promise.all([
                fetch(dataUrl),
                fetch(alertsUrl)
            ]);
            if (!dataResponse.ok) throw new Error(`Failed to fetch schedule data: ${dataResponse.statusText}`);
            if (!alertsResponse.ok) throw new Error(`Failed to fetch alert definitions: ${alertsResponse.statusText}`);

            const data = await dataResponse.json();
            this._alertDefinitions = await alertsResponse.json();
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
            endTime: parseDate(item.endTime),
            actualStartTime: parseDate(item.actualStartTime),
            actualEndTime: parseDate(item.actualEndTime)
        }));
        return { equipment: data.equipment, chartItems: chartItems, links: data.links };
    }

    async connectedCallback() { // Make it async
        try {
            const templateResponse = await fetch('gantt-chart-component.html');
            if (!templateResponse.ok) throw new Error(`Failed to load template: ${templateResponse.statusText}`);
            const templateContent = await templateResponse.text();
            this.shadowRoot.innerHTML = templateContent;

            this.fetchAllData();
            this.initEventListeners();
        } catch (error) {
            console.error("Error loading component template:", error);
            this.shadowRoot.innerHTML = `<p>Error loading component: ${error.message}</p>`;
        }
    }

    initEventListeners() {
        const sidePanel = this.shadowRoot.getElementById('side-panel');
        const toggleBtn = this.shadowRoot.getElementById('sidebar-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            sidePanel.classList.toggle('collapsed');
            setTimeout(() => this.drawChart(this.currentZoom), 300);
        });

        const zoomSlider = this.shadowRoot.getElementById('zoom-slider');
        const zoomValue = this.shadowRoot.getElementById('zoom-value');
        zoomSlider.addEventListener('input', () => {
            const hours = parseInt(zoomSlider.value, 10);
            zoomValue.textContent = `${hours}時間`;
            this.currentZoom = hours;

            // Do NOT touch start-time or end-time attributes.
            // Just call drawChart with the new zoom level.
            this.drawChart(this.currentZoom);
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
            if (customLineTimeInput.value) {
                this._customLines.push(new Date(customLineTimeInput.value));
                this.drawChart(this.currentZoom);
            }
        });

        const planVsActualButton = this.shadowRoot.getElementById('plan-vs-actual-button');
        planVsActualButton.addEventListener('click', () => {
            this.isPlanVsActualMode = !this.isPlanVsActualMode;
            planVsActualButton.classList.toggle('active', this.isPlanVsActualMode);
            this.drawChart(this.currentZoom);
        });

        const applyLayoutButton = this.shadowRoot.getElementById('apply-layout-button');
        applyLayoutButton.addEventListener('click', () => {
            const rowHeightInput = this.shadowRoot.getElementById('row-height-input');
            this.setAttribute('row-height', rowHeightInput.value);
        });
        
        const detailsPanel = this.shadowRoot.getElementById('details-panel');
        const detailsOverlay = this.shadowRoot.getElementById('details-panel-overlay');
        detailsOverlay.addEventListener('click', () => this.closePanel());

        // Zoom Buttons
        this.shadowRoot.querySelectorAll('.zoom-buttons button').forEach(button => {
            button.addEventListener('click', (event) => {
                const zoomHours = parseInt(event.target.dataset.zoom, 10);
                zoomSlider.value = zoomHours; // Update slider position
                zoomValue.textContent = `${zoomHours}時間`; // Update slider text
                this.currentZoom = zoomHours;
                this.drawChart(this.currentZoom);
            });
        });

        // Scroll Sync Logic
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

    openPanel(taskData) {
        const detailsPanel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('details-panel-overlay');
        
        const formatPanelDate = (date) => {
            return date ? date.toLocaleString('ja-JP') : 'N/A';
        };

        let content = `<div class="panel-header"><h2>タスク詳細</h2><span class="close-button">&times;</span></div>`;
        content += `<div class="panel-content">
            <p><strong>タスク ID:</strong> <span>${taskData.id || 'N/A'}</span></p>
            <p><strong>ジョブ ID:</strong> <span>${taskData.jobId || 'N/A'}</span></p>
            <p><strong>タイプ:</strong> <span>${taskData.type || 'N/A'}</span></p>
            <p><strong>設備:</strong> <span>${taskData.equipment || 'N/A'}</span></p>
            <p><strong>計画開始:</strong> <span>${formatPanelDate(taskData.startTime)}</span></p>
            <p><strong>計画終了:</strong> <span>${formatPanelDate(taskData.endTime)}</span></p>
        `;
        if(taskData.actualStartTime) content += `<p><strong>実績開始:</strong> <span>${formatPanelDate(taskData.actualStartTime)}</span></p>`;
        if(taskData.actualEndTime) content += `<p><strong>実績終了:</strong> <span>${formatPanelDate(taskData.actualEndTime)}</span></p>`;
        if(taskData.alertId && this._alertDefinitions[taskData.alertId]) content += `<p><strong>アラート:</strong> <span>${this._alertDefinitions[taskData.alertId].description}</span></p>`;
        if(taskData.description) content += `<p><strong>詳細:</strong> <span>${taskData.description}</span></p>`; // Add description
        content += `</div>`;
        
        detailsPanel.innerHTML = content;
        detailsPanel.classList.add('show');
        overlay.classList.add('show');
        detailsPanel.querySelector('.close-button').addEventListener('click', () => this.closePanel());
    }

    closePanel() {
        const detailsPanel = this.shadowRoot.getElementById('details-panel');
        const overlay = this.shadowRoot.getElementById('details-panel-overlay');
        detailsPanel.classList.remove('show');
        overlay.classList.remove('show');
    }

    drawChart(timeSpan) {
        if (!this._data) return;

        let { equipment, chartItems, links } = this._data;
        
        const drawableItems = chartItems.filter(d => d.startTime && d.endTime);

        const laneAssignedItems = this.assignLanes(drawableItems);
        const finalItems = this.assignActualLanes(laneAssignedItems);

        const itemsById = new Map(finalItems.map(d => [d.id, d]));

        const xAxisContainer = this.shadowRoot.getElementById("gantt-x-axis");
        const yAxisContainer = this.shadowRoot.getElementById("gantt-y-axis");
        const chartAreaContainer = this.shadowRoot.getElementById("gantt-chart-area");

        d3.select(xAxisContainer).selectAll("*").remove();
        d3.select(yAxisContainer).selectAll("*").remove();
        d3.select(chartAreaContainer).selectAll("*").remove();

        const equipmentWithActuals = this.isPlanVsActualMode 
            ? equipment.flatMap(e => [e, `${e}の実績`]) 
            : equipment;

        const constRowHeight = parseInt(this.getAttribute('row-height'), 10) || 50;
        const chartHeight = constRowHeight * equipmentWithActuals.length;
        const margin = { top: 50, right: 30, bottom: 20, left: 100 };
        const height = chartHeight;
        
        const portHeight = 12;

        // --- DOMAIN (Time Window) ---
        let domainMin, domainMax;
        const startTimeAttr = this.getAttribute('start-time');
        const endTimeAttr = this.getAttribute('end-time');

        if (startTimeAttr && endTimeAttr && startTimeAttr !== '' && endTimeAttr !== '') {
            domainMin = new Date(startTimeAttr);
            domainMax = new Date(endTimeAttr);
        } else {
            const allTimes = chartItems.flatMap(d => [d.startTime, d.endTime]).filter(Boolean);
                        domainMin = d3.min(allTimes) || new Date();
                        // Default to 24 hours from domainMin if no end-time attribute
                        domainMax = d3.timeDay.offset(domainMin, 1);         }
        this._currentDomainMin = domainMin; // Store current domain min
        this._currentDomainMax = domainMax; // Store current domain max

        // --- RANGE (Pixel Width) ---
        const totalDurationMs = domainMax.getTime() - domainMin.getTime();
        const totalDurationHours = totalDurationMs / (1000 * 60 * 60);

        const standardViewportWidth = 800; // A reference width for zoom calculation
        const pixelsPerHour = standardViewportWidth / timeSpan; // timeSpan is currentZoom
        const calculatedWidth = totalDurationHours * pixelsPerHour;

        // If the actual duration is less than what the zoom level implies for a standard viewport,
        // then the chart should not be compressed, but rather show empty space.
        // So, the width should be at least standardViewportWidth.
        const finalChartWidth = Math.max(calculatedWidth, standardViewportWidth);

        const yScale = d3.scaleBand().domain(equipmentWithActuals).range([0, height]).padding(0.2);
        const xScale = d3.scaleTime().range([0, finalChartWidth]);
        xScale.domain([domainMin, domainMax]); // Set domain after range is defined

        const formatForInput = (date) => {
            if (!date) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        this.shadowRoot.getElementById('start-time-input').value = formatForInput(domainMin);
        this.shadowRoot.getElementById('end-time-input').value = formatForInput(domainMax);

        // --- RENDER X-AXIS (Header) ---
        const xAxisSvg = d3.select(xAxisContainer).append("svg")
            .attr("width", finalChartWidth) // Use finalChartWidth
            .attr("height", margin.top);
        
        const xAxisGroup = xAxisSvg.append("g").attr("transform", `translate(0, ${margin.top})`);
        const dayAxis = xAxisGroup.append("g").attr("class", "x-axis-day axis").attr("transform", `translate(0,-30)`).call(d3.axisTop(xScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%m/%d")));
        dayAxis.selectAll("line").remove(); // Remove lines from header
        xAxisGroup.append("text").attr("class", "top-left-date").attr("x", 10).attr("y", -35).text(d3.timeFormat("%m/%d")(domainMin));
        xAxisGroup.append("g").attr("class", "x-axis-time axis").call(d3.axisTop(xScale).ticks(d3.timeHour.every(1)).tickFormat(d3.timeFormat("%H:%M")));

        // --- RENDER Y-AXIS (Side) ---
        const yAxisSvg = d3.select(yAxisContainer).append("svg")
            .attr("width", margin.left)
            .attr("height", height + margin.top + margin.bottom);
        
        const yAxisGroup = yAxisSvg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScale));
        yAxisGroup.select(".domain").remove();

        // --- RENDER CHART BODY ---
        const chartBodySvg = d3.select(chartAreaContainer).append("svg")
            .attr("width", finalChartWidth) // Use finalChartWidth
            .attr("height", height + margin.top + margin.bottom);

        const svg = chartBodySvg.append("g")
            .attr("transform", `translate(0, ${margin.top})`);

        // --- GRIDS (in body only) ---
        svg.append("g").attr("class", "grid-lines").attr("transform", `translate(0, ${-margin.top})`).call(d3.axisTop(xScale).ticks(d3.timeMinute.every(30)).tickSize(-(height + margin.top + margin.bottom)).tickFormat(""));

        const itemGroups = svg.append("g").selectAll("g").data(finalItems).join("g").attr("class", "item-group").on("click", (event, d) => this.openPanel(d));

        const maxLanesByEquipment = new Map();
        equipment.forEach(eq => {
            const maxLane = d3.max(finalItems.filter(i => i.equipment === eq), i => i.lane);
            maxLanesByEquipment.set(eq, (maxLane === undefined ? 0 : maxLane) + 1);
        });

        const maxActualLanesByEquipment = new Map();
        if (this.isPlanVsActualMode) {
            equipment.forEach(eq => {
                const maxLane = d3.max(chartItems.filter(i => i.equipment === eq && i.actualLane !== undefined), i => i.actualLane);
                maxActualLanesByEquipment.set(eq, (maxLane === undefined ? 0 : maxLane) + 1);
            });
        }

        // Planned Bars
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
            .style("fill", d => {
                if (d.type.startsWith('port')) return '#A3BFFA';
                if (d.options && d.options.find(o => o.startsWith('pattern'))) {
                    return `url(#${d.options.find(o => o.startsWith('pattern'))})`;
                }
                return null;
            })
            .style("stroke", d => {
                if (d.type.startsWith('port')) return '#5A67D8';
                return null;
            });

        // Actual Bars
        if (this.isPlanVsActualMode) {
            itemGroups.filter(d => d.actualStartTime).append("rect")
                .attr("class", "actual-bar")
                .attr("x", d => xScale(d.actualStartTime))
                .attr("y", d => {
                    const numLanes = maxActualLanesByEquipment.get(d.equipment);
                    const laneHeight = yScale.bandwidth() / numLanes;
                    return yScale(`${d.equipment}の実績`) + (d.actualLane * laneHeight);
                })
                .attr("width", d => {
                    const endTime = d.actualEndTime || new Date();
                    return Math.max(0, xScale(endTime) - xScale(d.actualStartTime));
                })
                .attr("height", d => {
                    const numLanes = maxActualLanesByEquipment.get(d.equipment);
                    return yScale.bandwidth() / numLanes;
                })
                .attr("rx", 2).attr("ry", 2);
        }

        // Labels
        itemGroups.append("text")
            .attr("class", "task-label")
            .attr("x", d => xScale(d.startTime) + 6)
            .attr("y", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment);
                const laneHeight = yScale.bandwidth() / numLanes;
                return yScale(d.equipment) + (d.lane * laneHeight) + (laneHeight / 2);
            })
            .attr("dy", "0.35em")
            .text(d => d.id);

        // Links
        svg.append("g").attr("class", "links").selectAll("line").data(links).join("line").attr("class", "link-line").each(function(d) { 
            const sourceItem = itemsById.get(d.source);
            const targetItem = itemsById.get(d.target);
            if (!sourceItem || !targetItem) return;
            const getTaskCenterY = (item) => {
                const numLanes = maxLanesByEquipment.get(item.equipment);
                const laneHeight = yScale.bandwidth() / numLanes;
                return yScale(item.equipment) + (item.lane * laneHeight) + (laneHeight / 2);
            };
            const x1 = xScale(sourceItem.endTime);
            const y1 = getTaskCenterY(sourceItem);
            const x2 = xScale(targetItem.startTime);
            const y2 = getTaskCenterY(targetItem);
            d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2); 
        });

        // Current Time Line
        const now = new Date();
        if (now >= domainMin && now <= domainMax) {
            svg.append("line").attr("class", "current-time-line").attr("x1", xScale(now)).attr("x2", xScale(now)).attr("y1", -margin.top).attr("y2", height + margin.bottom).attr("stroke-width", 2).attr("stroke-dasharray", "4 4");
        }

        // Custom Lines
        this._customLines.forEach(lineTime => {
            if (lineTime >= domainMin && lineTime <= domainMax) {
                svg.append("line").attr("class", "custom-time-line").attr("x1", xScale(lineTime)).attr("x2", xScale(lineTime)).attr("y1", -margin.top).attr("y2", height + margin.bottom).attr("stroke-width", 2).attr("stroke-dasharray", "8 4");
            }
        });

        // Alert Icons
        const tooltip = svg.append("g").attr("class", "gantt-tooltip").style("opacity", 0);
        tooltip.append("rect").attr("width", 180).attr("height", 30).attr("fill", "black").attr("rx", 5);
        tooltip.append("text").attr("x", 10).attr("y", 20).attr("fill", "white").style("font-size", "12px");
        itemGroups.filter(d => d.alertId && this._alertDefinitions[d.alertId]).append("text")
            .attr("class", "alert-icon")
            .attr("x", d => xScale(d.startTime) - 20)
            .attr("y", d => {
                const numLanes = maxLanesByEquipment.get(d.equipment);
                const laneHeight = yScale.bandwidth() / numLanes;
                return yScale(d.equipment) + (d.lane * laneHeight) + (laneHeight / 2) + 5;
            })
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
}
customElements.define('gantt-chart-component', GanttChartComponent);