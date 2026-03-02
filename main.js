document.addEventListener('DOMContentLoaded', () => {
    // Unit definitions
    const units = {
        torque: {
            icon: 'fa-wrench',
            base: 'N·m',
            list: [
                { id: 'N·m', name: 'N·m', factor: 1 },
                { id: 'dN·m', name: 'dN·m', factor: 10 },
                { id: 'cN·m', name: 'cN·m', factor: 100 },
                { id: 'kgf·m', name: 'kgf·m', factor: 0.101972 },
                { id: 'kgf·cm', name: 'kgf·cm', factor: 10.1972 },
                { id: 'gf·cm', name: 'gf·cm', factor: 10197.2 },
                { id: 'lbf·ft', name: 'lbf·ft', factor: 0.737562 },
                { id: 'lbf·in', name: 'lbf·in', factor: 8.85075 },
                { id: 'ozf·in', name: 'ozf·in', factor: 141.612 }
            ]
        },
        pressure: {
            icon: 'fa-gauge-high',
            base: 'Pa',
            list: [
                { id: 'Pa', name: 'Pa', factor: 1 },
                { id: 'kPa', name: 'kPa', factor: 0.001 },
                { id: 'MPa', name: 'MPa', factor: 0.000001 },
                { id: 'bar', name: 'bar', factor: 0.00001 },
                { id: 'psi', name: 'psi', factor: 0.000145038 },
                { id: 'atm', name: 'atm', factor: 0.0000098692 },
                { id: 'kgf/cm2', name: 'kgf/cm²', factor: 0.000010197 }
            ]
        },
        temperature: {
            icon: 'fa-temperature-half',
            base: 'C',
            list: [
                { id: 'C', name: '°C' },
                { id: 'F', name: '°F' },
                { id: 'K', name: 'K' }
            ]
        }
    };

    const transducers = [
        { model: '2000-4-02', specRange: '5-50 In Oz', minNm: 0.0353, maxNm: 0.3531 },
        { model: '2000-5-02', specRange: '15-200 In Oz', minNm: 0.1059, maxNm: 1.4124 },
        { model: '2000-6-02', specRange: '4-50 In Lbs', minNm: 0.4519, maxNm: 5.6493 },
        { model: '2000-65-02', specRange: '15-150 In Lbs', minNm: 1.6947, maxNm: 16.9478 },
        { model: '2000-7-02', specRange: '30-400 In Lbs', minNm: 3.3895, maxNm: 45.1940 },
        { model: '2000-8-02', specRange: '80-1000 In Lbs', minNm: 9.0387, maxNm: 112.9848 },
        { model: '2000-10-02', specRange: '10-125 Ft Lbs', minNm: 13.5582, maxNm: 169.4771 },
        { model: '2000-11-02', specRange: '20-250 Ft Lbs', minNm: 27.1164, maxNm: 338.9542 },
        { model: '2000-400-02', specRange: '4 In Lbs - 250 Ft Lbs', minNm: 0.4519, maxNm: 338.9542 },
        { model: '2000-12-02', specRange: '60-600 Ft Lbs', minNm: 81.3490, maxNm: 813.4901 },
        { model: '2000-13-02', specRange: '100-1000 Ft Lbs', minNm: 135.5817, maxNm: 1355.8169 },
        { model: '2000-14-02', specRange: '200-2000 Ft Lbs', minNm: 271.1634, maxNm: 2711.6336 }
    ];

    let currentTab = 'torque';
    let currentTolerance = 4; // default 4%

    // DOM Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const calibrationCard = document.getElementById('calibrationCard');
    const inputValueEl = document.getElementById('inputValue');
    const inputUnitLabel = document.getElementById('inputUnitLabel');
    const fromUnitSelect = document.getElementById('fromUnit');
    const toUnitSelect = document.getElementById('toUnit');
    const swapBtn = document.getElementById('swapUnitsBtn');
    const resultValueEl = document.getElementById('resultValue');
    const resultUnitLabel = document.getElementById('resultUnitLabel');
    const resultBgIcon = document.getElementById('resultBgIcon');
    const copyBtn = document.getElementById('copyResultBtn');
    
    // Calibration elements
    const tolBtns = document.querySelectorAll('.tol-btn:not(.custom-tol-btn)');
    const customTolBtn = document.querySelector('.custom-tol-btn');
    const customTolInput = document.getElementById('customTolInput');
    const calibrationTableBody = document.getElementById('calibrationTableBody');

    // Ruler elements
    const rulerToggle = document.getElementById('rulerToggle');
    const rulerSettings = document.getElementById('rulerSettings');
    const mainIntervalEl = document.getElementById('mainInterval');
    const subDivisionsEl = document.getElementById('subDivisions');
    const rulerResolutionInfo = document.getElementById('rulerResolutionInfo');

    // Initialization
    function init() {
        populateSelects();
        updateUIForTab();
        calculate();
    }

    // Format numbers with commas and up to 4 decimal places
    function formatNumber(num) {
        if (isNaN(num)) return '0';
        // Avoid scientific notation for typical values, handle floats
        let numStr = num.toFixed(4);
        // Remove trailing zeros after decimal
        numStr = parseFloat(numStr).toString();
        
        let parts = numStr.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    function formatFixed(num, decimals = 2) {
        if (isNaN(num)) return '0.00';
        let numStr = num.toFixed(decimals);
        let parts = numStr.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    // Temperature Conversion logic
    function convertTemperature(value, from, to) {
        if (from === to) return value;
        let celsius = value;
        
        // Convert to Celsius first
        if (from === 'F') celsius = (value - 32) * 5/9;
        else if (from === 'K') celsius = value - 273.15;

        // Convert from Celsius to target
        if (to === 'C') return celsius;
        else if (to === 'F') return (celsius * 9/5) + 32;
        else if (to === 'K') return celsius + 273.15;
        
        return value;
    }

    // Main calculation
    function calculate() {
        const val = parseFloat(inputValueEl.value);
        if (isNaN(val)) {
            resultValueEl.textContent = '0';
            return;
        }

        const fromId = fromUnitSelect.value;
        const toId = toUnitSelect.value;
        let result = 0;

        if (currentTab === 'temperature') {
            result = convertTemperature(val, fromId, toId);
        } else {
            const unitData = units[currentTab].list;
            const fromUnit = unitData.find(u => u.id === fromId);
            const toUnit = unitData.find(u => u.id === toId);
            
            if (fromUnit && toUnit) {
                // Convert to base unit first, then to target unit
                const baseValue = val / fromUnit.factor;
                result = baseValue * toUnit.factor;
            }
        }

        resultValueEl.textContent = formatNumber(result);
        resultUnitLabel.textContent = toId;
        inputUnitLabel.textContent = fromId;
        
        if (currentTab === 'torque') {
            updateCalibrationTable();
        }
    }

    // Update Calibration Table
    function updateCalibrationTable() {
        if (currentTab !== 'torque') return;
        
        const val = parseFloat(inputValueEl.value);
        const unit = fromUnitSelect.value;
        
        if (isNaN(val) || val <= 0) {
            calibrationTableBody.innerHTML = '<tr><td colspan="4">올바른 값을 입력해주세요.</td></tr>';
            return;
        }

        const points = [20, 60, 100];
        let html = '';
        
        // Determine tolerance basis
        const basisRadio = document.querySelector('input[name="toleranceBasis"]:checked');
        const basis = basisRadio ? basisRadio.value : 'indicated';
        
        const main = parseFloat(mainIntervalEl.value) || 10;
        const isRulerActive = rulerToggle.checked;

        points.forEach(percent => {
            let target = val * (percent / 100);
            
            // Snap target to nearest main interval if ruler is active, EXCEPT for 100%
            if (isRulerActive && !isNaN(main) && main > 0 && percent !== 100) {
                target = Math.round(target / main) * main;
            }

            let toleranceVal = 0;

            if (basis === 'fs') {
                // FS(100%) 기준
                toleranceVal = val * (currentTolerance / 100);
            } else {
                // 지시치 기준
                toleranceVal = target * (currentTolerance / 100);
            }
            
            const min = target - toleranceVal;
            const max = target + toleranceVal;

            // ... (rest of the row HTML generation)
            let actualPercentText = isRulerActive ? `~${percent}%` : `${percent}%`;
            if (isRulerActive && percent !== 100) {
                const actualPercent = (target / val) * 100;
                actualPercentText = `<span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:2px;">(목표: ${percent}%)</span>${formatFixed(actualPercent, 1)}%`;
            } else if (isRulerActive && percent === 100) {
                 actualPercentText = `${percent}%`;
            }

            html += `
                <tr>
                    <td><span class="cal-percent-badge" style="display:inline-block; text-align:center;">${actualPercentText}</span></td>
                    <td>
                        <div class="target-val">
                            ${formatFixed(target)}
                            <span class="target-unit">${unit}</span>
                        </div>
                    </td>
                    <td class="min-val">${formatFixed(min)}</td>
                    <td class="max-val">${formatFixed(max)}</td>
                </tr>
            `;

            // Ruler visualization row
            if (isRulerActive) {
                html += `
                <tr>
                    <td colspan="4" style="padding: 0;">
                        <div class="ruler-container">
                            <canvas id="ruler-${percent}" class="ruler-canvas" width="400" height="60"></canvas>
                            <div class="ruler-text" id="ruler-text-${percent}"></div>
                        </div>
                    </td>
                </tr>
                `;
            }
        });

        calibrationTableBody.innerHTML = html;
        
        // Draw rulers
        if (isRulerActive) {
            const sub = parseInt(subDivisionsEl.value) || 10;
            const resolution = main / sub;

            points.forEach(percent => {
                let target = val * (percent / 100);
                if (!isNaN(main) && main > 0 && percent !== 100) {
                    target = Math.round(target / main) * main;
                }
                
                let toleranceVal = 0;
                if (basis === 'fs') {
                    toleranceVal = val * (currentTolerance / 100);
                } else {
                    toleranceVal = target * (currentTolerance / 100);
                }

                drawRuler(`ruler-${percent}`, target, toleranceVal, resolution, unit, main);
                
                // Update text
                const ticks = toleranceVal / resolution;
                const textEl = document.getElementById(`ruler-text-${percent}`);
                if (textEl) {
                    textEl.innerHTML = `허용 오차: <strong>±${formatFixed(ticks, 1)} 칸</strong>`;
                }
            });
        }

        updateTransducerRecommendation();
    }

    function drawRuler(canvasId, target, tolerance, resolution, unit, mainIntervalParam) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // We want to show a range that covers the target and the tolerance plus some padding
        // Let's show roughly target - (tolerance*3) to target + (tolerance*3)
        // Or at least a fixed number of ticks, e.g., 20 ticks total.
        const totalTicksToShow = 20;
        const rangeView = totalTicksToShow * resolution;
        const minValView = target - (rangeView / 2);
        const maxValView = target + (rangeView / 2);

        // Scale factor: pixels per unit
        const scaleX = width / rangeView;

        // Draw Tolerance Band
        const tolMinX = (target - tolerance - minValView) * scaleX;
        const tolMaxX = (target + tolerance - minValView) * scaleX;
        
        ctx.fillStyle = 'rgba(24, 128, 56, 0.15)'; // Success color light
        ctx.fillRect(tolMinX, 0, tolMaxX - tolMinX, height);
        
        // Draw tick marks
        // Find the first main interval tick before minValView
        const mainInterval = mainIntervalParam || (resolution * parseInt(subDivisionsEl.value || 10));
        let currentMainTick = Math.floor(minValView / mainInterval) * mainInterval;

        ctx.strokeStyle = '#86868b';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#86868b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        while (currentMainTick <= maxValView) {
            // Draw sub ticks for this main tick
            for (let i = 0; i < parseInt(subDivisionsEl.value || 10); i++) {
                const tickVal = currentMainTick + (i * resolution);
                if (tickVal >= minValView && tickVal <= maxValView) {
                    const x = (tickVal - minValView) * scaleX;
                    const isMain = i === 0;
                    const tickHeight = isMain ? 25 : 15;
                    
                    ctx.beginPath();
                    ctx.moveTo(x, height);
                    ctx.lineTo(x, height - tickHeight);
                    
                    if (isMain) {
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.lineWidth = 1;
                        ctx.fillText(formatFixed(tickVal, tickVal < 10 ? 1 : 0), x, height - 30);
                    } else {
                        ctx.stroke();
                    }
                }
            }
            currentMainTick += mainInterval;
        }

        // Draw Target Line
        const targetX = (target - minValView) * scaleX;
        ctx.strokeStyle = 'var(--primary-color, #5c4bdb)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(targetX, 0);
        ctx.lineTo(targetX, height);
        ctx.stroke();
        
        // Draw Target Value
        ctx.fillStyle = 'var(--primary-color, #5c4bdb)';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(formatFixed(target), targetX, 15);
    }

    // Update Transducer Recommendation
    function updateTransducerRecommendation() {
        if (currentTab !== 'torque') return;

        const val = parseFloat(inputValueEl.value);
        const fromId = fromUnitSelect.value;
        const transducerListEl = document.getElementById('transducerList');

        if (isNaN(val) || val <= 0) {
            transducerListEl.innerHTML = '<li>올바른 값을 입력해주세요.</li>';
            return;
        }

        const unitData = units['torque'].list;
        const fromUnit = unitData.find(u => u.id === fromId);
        
        if (!fromUnit) return;

        // Calculate max and min required N.m (20% to 100% of the input value)
        const maxNm = (val / fromUnit.factor);
        const minNm = maxNm * 0.2;

        const matches = transducers.filter(t => t.minNm <= minNm && t.maxNm >= maxNm);

        if (matches.length === 0) {
            transducerListEl.innerHTML = '<li>해당 범위를 만족하는 권장 모델이 없습니다.</li>';
        } else {
            transducerListEl.innerHTML = matches.map(t => {
                // Convert the transducer's min/max Nm back to the user's selected unit for display
                const convertedMin = t.minNm * fromUnit.factor;
                const convertedMax = t.maxNm * fromUnit.factor;
                
                // Format nicely (remove excessive decimals if large number, else keep some precision)
                const formattedMin = formatFixed(convertedMin, convertedMin < 10 ? 3 : 1);
                const formattedMax = formatFixed(convertedMax, convertedMax < 10 ? 3 : 1);

                return `<li><span style="color:var(--primary-color);font-weight:bold;">${t.model}</span> : ${t.specRange} (${formattedMin} - ${formattedMax} ${fromId})</li>`;
            }).join('');
        }
    }

    // Populate dropdowns based on current tab
    function populateSelects() {
        const list = units[currentTab].list;
        let optionsHtml = list.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
        
        fromUnitSelect.innerHTML = optionsHtml;
        toUnitSelect.innerHTML = optionsHtml;
        
        // Set default "to" unit to something different if possible
        if (list.length > 1) {
            toUnitSelect.selectedIndex = 1;
        }
    }

    // Update UI when tab changes
    function updateUIForTab() {
        // Update background icon
        resultBgIcon.className = `fa-solid ${units[currentTab].icon} bg-icon`;
        
        // Show/hide calibration card
        if (currentTab === 'torque') {
            calibrationCard.style.display = 'block';
        } else {
            calibrationCard.style.display = 'none';
        }
    }

    // Event Listeners
    rulerToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            rulerSettings.classList.remove('hidden');
            // FS(100%) 기준 라디오 버튼 선택
            const fsRadio = document.querySelector('input[name="toleranceBasis"][value="fs"]');
            if (fsRadio) {
                fsRadio.checked = true;
            }
            // 2% 오차 버튼 선택 및 설정
            const tol2Btn = document.querySelector('.tol-btn[data-tol="2"]');
            if (tol2Btn) {
                tolBtns.forEach(b => b.classList.remove('active'));
                customTolBtn.classList.remove('active');
                customTolInput.classList.add('hidden');
                tol2Btn.classList.add('active');
                currentTolerance = 2;
            }
        } else {
            rulerSettings.classList.add('hidden');
        }
        updateCalibrationTable();
    });

    [mainIntervalEl, subDivisionsEl].forEach(el => {
        el.addEventListener('input', () => {
            updateRulerInfo();
            updateCalibrationTable();
        });
    });

    function updateRulerInfo() {
        const main = parseFloat(mainIntervalEl.value);
        const sub = parseInt(subDivisionsEl.value);
        if (!isNaN(main) && !isNaN(sub) && sub > 0) {
            const resolution = main / sub;
            const unit = fromUnitSelect.value;
            rulerResolutionInfo.textContent = `최소 눈금 단위: ${formatFixed(resolution, resolution < 1 ? 3 : 1)} ${unit}`;
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentTab = e.currentTarget.dataset.tab;
            populateSelects();
            updateUIForTab();
            calculate();
        });
    });

    swapBtn.addEventListener('click', () => {
        const temp = fromUnitSelect.value;
        fromUnitSelect.value = toUnitSelect.value;
        toUnitSelect.value = temp;
        calculate();
    });

    inputValueEl.addEventListener('input', calculate);
    fromUnitSelect.addEventListener('change', calculate);
    toUnitSelect.addEventListener('change', calculate);

    // Tolerance basis radio buttons
    const basisRadios = document.querySelectorAll('input[name="toleranceBasis"]');
    basisRadios.forEach(radio => {
        radio.addEventListener('change', updateCalibrationTable);
    });

    // Tolerance buttons
    tolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tolBtns.forEach(b => b.classList.remove('active'));
            customTolBtn.classList.remove('active');
            customTolInput.classList.add('hidden');
            
            e.currentTarget.classList.add('active');
            currentTolerance = parseFloat(e.currentTarget.dataset.tol);
            updateCalibrationTable();
        });
    });

    customTolBtn.addEventListener('click', () => {
        tolBtns.forEach(b => b.classList.remove('active'));
        customTolBtn.classList.add('active');
        customTolInput.classList.remove('hidden');
        customTolInput.focus();
        
        if (customTolInput.value) {
            currentTolerance = parseFloat(customTolInput.value);
            updateCalibrationTable();
        }
    });

    customTolInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 0) {
            currentTolerance = val;
            updateCalibrationTable();
        }
    });

    // Copy to clipboard
    copyBtn.addEventListener('click', async () => {
        const textToCopy = `${resultValueEl.textContent} ${resultUnitLabel.textContent}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> 복사됨';
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });

    // Run init
    init();
});