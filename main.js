// ==UserScript==
// @name         Geofs FIP (Geofs Flight information plugin)
// @namespace    https://github.com/Geo-CA/Geofs-FIP
// @version      1.4
// @description  Geofs Flight information plugin
// @author       Geo-CA
// @match        *://*.geo-fs.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function() {
    'use strict';

    function waitForBottomBar(callback) {
        const timer = setInterval(() => {
            const bar = document.querySelector('.geofs-ui-bottom, [class*="bottom-bar"], .bottom-ui');
            if (bar && bar.offsetParent !== null) {
                clearInterval(timer);
                callback(bar);
            }
        }, 200);
    }

    function startPlugin() {
        if (document.getElementById('flightInfoPanelGeoCA')) return;

        const panel = document.createElement('div');
        panel.id = 'flightInfoPanelGeoCA';
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.left = '10px';
        panel.style.width = '320px';
        panel.style.background = 'rgba(10, 15, 30, 0.97)';
        panel.style.color = '#ffffff';
        panel.style.padding = '8px';
        panel.style.borderRadius = '8px';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.zIndex = '99999';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '6px';
        panel.style.border = '1px solid #00ccff';

        const lang = {
            zhCN: {
                title: 'Geofs航班信息插件',
                saveTitle: '航班信息',
                author: '本插件由抖音、bilibili Geo-CA制作',
                start: '开始',
                stop: '结束',
                status0: '航班未开始',
                status1: '航班进行中',
                status2: '航班已结束',
                date: '航班日期：',
                flightNo: '航班号：',
                acType: '机型：',
                dep: '起飞机场：',
                arr: '降落机场：',
                ete: '预计飞行时间：',
                hotkey: '按K键开关面板',
                wish: '祝您飞行愉快',
                close: '关闭',
                reset: '重置',
                save: '保存',
                back: '返回',
                langBtn: '简体中文',
                toggleMiniBtn: '隐藏按钮',
                showBtn: '显示按钮',
                settings: '设置 ▼'
            },
            en: {
                title: 'Geofs Flight Info',
                saveTitle: 'Flight Info',
                author: 'By Douyin & Bilibili Geo-CA',
                start: 'Start',
                stop: 'Stop',
                status0: 'Not Started',
                status1: 'In Progress',
                status2: 'Completed',
                date: 'Date:',
                flightNo: 'Flight:',
                acType: 'Aircraft:',
                dep: 'Dep:',
                arr: 'Arr:',
                ete: 'Duration:',
                hotkey: 'Press K to toggle panel',
                wish: 'Have a nice flight',
                close: 'Close',
                reset: 'Reset',
                save: 'Save',
                back: 'Back',
                langBtn: 'English',
                toggleMiniBtn: 'Hide Button',
                showBtn: 'Show Button',
                settings: 'Settings ▼'
            },
            zhTW: {
                title: 'Geofs航班資訊外掛',
                saveTitle: '航班資訊',
                author: '此外掛由抖音、bilibili Geo-CA製作',
                start: '開始',
                stop: '結束',
                status0: '航班未開始',
                status1: '航班進行中',
                status2: '航班已結束',
                date: '航班日期：',
                flightNo: '航班號：',
                acType: '機型：',
                dep: '起飛機場：',
                arr: '降落機場：',
                ete: '預計飛行時間：',
                hotkey: '按K鍵開關面板',
                wish: '祝您飛行愉快',
                close: '關閉',
                reset: '重置',
                save: '儲存',
                back: '返回',
                langBtn: '繁體中文',
                toggleMiniBtn: '隱藏按鈕',
                showBtn: '顯示',
                settings: '設定 ▼'
            }
        };

        let currentLang = 'en';
        let flightStatus = 0;
        let timerId = null;
        let seconds = 0;
        let miniBtnVisible = true;
        let miniBtn, toggleMiniBtn;
        let isViewMode = false;

        function blockGameKeysOnInput(input) {
            input.addEventListener('focus', () => { window.__geoInputActive = true; });
            input.addEventListener('blur', () => { window.__geoInputActive = false; });
            function stop(e) { e.stopImmediatePropagation(); e.stopPropagation(); }
            input.addEventListener('keydown', stop);
            input.addEventListener('keyup', stop);
            input.addEventListener('keypress', stop);
        }

        function createCollapse(title) {
            const head = document.createElement('div');
            head.style.padding = '4px 8px';
            head.style.background = '#000000';
            head.style.borderRadius = '6px';
            head.style.cursor = 'pointer';
            head.style.fontSize = '12px';
            head.style.color = '#ffffff';
            head.textContent = title;

            const body = document.createElement('div');
            body.style.display = 'none';
            body.style.padding = '6px';
            body.style.gap = '6px';
            body.style.background = '#0a0f1e';
            body.style.borderRadius = '6px';
            body.style.marginTop = '2px';
            body.style.flexDirection = 'column';

            head.onclick = () => { body.style.display = body.style.display === 'none' ? 'flex' : 'none'; };
            return { head, body };
        }

        const collapse = createCollapse(lang[currentLang].settings);

        function updateText() {
            const l = lang[currentLang];
            line1.textContent = isViewMode ? l.saveTitle : l.title;
            line2.textContent = l.author;
            toggleBtn.textContent = timerId ? l.stop : l.start;
            statusText.textContent = flightStatus === 0 ? l.status0 : flightStatus === 1 ? l.status1 : l.status2;
            dateSpan.textContent = l.date;
            flightNoSpan.textContent = l.flightNo;
            acTypeSpan.textContent = l.acType;
            depSpan.textContent = l.dep;
            arrSpan.textContent = l.arr;
            eteSpan.textContent = l.ete;
            line6.textContent = l.hotkey;
            wishText.textContent = l.wish;
            closeBtn.textContent = l.close;
            resetBtn.textContent = l.reset;
            saveBtn.textContent = l.save;
            backBtn.textContent = l.back;
            langBtn.textContent = l.langBtn;
            toggleMiniBtn.textContent = miniBtnVisible ? l.toggleMiniBtn : l.showBtn;
            collapse.head.textContent = l.settings;
        }

        const line1 = document.createElement('div');
        line1.style.textAlign = 'center';
        line1.style.fontSize = '15px';
        line1.style.fontWeight = 'bold';
        line1.style.color = '#ffffff';
        panel.appendChild(line1);

        const line2 = document.createElement('div');
        line2.style.textAlign = 'center';
        line2.style.fontSize = '11px';
        line2.style.color = '#ffffff';
        panel.appendChild(line2);

        const line3 = document.createElement('div');
        line3.style.display = 'flex';
        line3.style.alignItems = 'center';
        line3.style.gap = '8px';

        const toggleBtn = document.createElement('button');
        toggleBtn.style.padding = '3px 8px';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.background = '#000000';
        toggleBtn.style.color = '#ffffff';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '6px';
        toggleBtn.style.fontWeight = 'bold';

        const timerDisplay = document.createElement('div');
        timerDisplay.textContent = '00:00:00';
        timerDisplay.style.minWidth = '70px';
        timerDisplay.style.fontFamily = 'monospace';
        timerDisplay.style.fontSize = '14px';
        timerDisplay.style.color = '#ffffff';
        timerDisplay.style.fontWeight = 'bold';

        const statusText = document.createElement('div');
        statusText.style.fontSize = '12px';
        statusText.style.color = '#ffffff';
        statusText.style.fontWeight = 'bold';

        line3.appendChild(toggleBtn);
        line3.appendChild(timerDisplay);
        line3.appendChild(statusText);
        panel.appendChild(line3);

        const lineDate = document.createElement('div');
        lineDate.style.display = 'flex';
        lineDate.style.gap = '6px';
        lineDate.style.alignItems = 'center';
        lineDate.style.fontSize = '12px';

        const dateSpan = document.createElement('span');
        dateSpan.style.color = '#ffffff';
        dateSpan.style.fontWeight = 'bold';

        const dateInput = document.createElement('input');
        dateInput.type = 'text';
        dateInput.style.width = '140px';
        dateInput.style.padding = '2px';
        dateInput.style.border = '1px solid #000000';
        dateInput.style.borderRadius = '4px';
        dateInput.style.background = '#111111';
        dateInput.style.color = '#ffffff';
        dateInput.style.outline = 'none';
        blockGameKeysOnInput(dateInput);

        lineDate.appendChild(dateSpan);
        lineDate.appendChild(dateInput);
        panel.appendChild(lineDate);

        const line4 = document.createElement('div');
        line4.style.display = 'flex';
        line4.style.flexWrap = 'wrap';
        line4.style.gap = '6px';
        line4.style.alignItems = 'center';
        line4.style.fontSize = '12px';

        const flightNoSpan = document.createElement('span');
        flightNoSpan.style.color = '#ffffff';
        flightNoSpan.style.fontWeight = 'bold';
        const flightNoInput = document.createElement('input');
        flightNoInput.type = 'text';
        flightNoInput.style.width = '70px';
        flightNoInput.style.padding = '2px';
        flightNoInput.style.border = '1px solid #000000';
        flightNoInput.style.borderRadius = '4px';
        flightNoInput.style.background = '#111111';
        flightNoInput.style.color = '#ffffff';
        flightNoInput.style.outline = 'none';
        blockGameKeysOnInput(flightNoInput);
        line4.appendChild(flightNoSpan);
        line4.appendChild(flightNoInput);

        const acTypeSpan = document.createElement('span');
        acTypeSpan.style.color = '#ffffff';
        acTypeSpan.style.fontWeight = 'bold';
        const acTypeInput = document.createElement('input');
        acTypeInput.type = 'text';
        acTypeInput.style.width = '70px';
        acTypeInput.style.padding = '2px';
        acTypeInput.style.border = '1px solid #000000';
        acTypeInput.style.borderRadius = '4px';
        acTypeInput.style.background = '#111111';
        acTypeInput.style.color = '#ffffff';
        acTypeInput.style.outline = 'none';
        blockGameKeysOnInput(acTypeInput);
        line4.appendChild(acTypeSpan);
        line4.appendChild(acTypeInput);
        panel.appendChild(line4);

        const line5 = document.createElement('div');
        line5.style.display = 'flex';
        line5.style.flexWrap = 'wrap';
        line5.style.gap = '6px';
        line5.style.alignItems = 'center';
        line5.style.fontSize = '12px';

        const depSpan = document.createElement('span');
        depSpan.style.color = '#ffffff';
        depSpan.style.fontWeight = 'bold';
        const depInput = document.createElement('input');
        depInput.type = 'text';
        depInput.style.width = '60px';
        depInput.style.padding = '2px';
        depInput.style.border = '1px solid #000000';
        depInput.style.borderRadius = '4px';
        depInput.style.background = '#111111';
        depInput.style.color = '#ffffff';
        depInput.style.outline = 'none';
        blockGameKeysOnInput(depInput);
        line5.appendChild(depSpan);
        line5.appendChild(depInput);

        const arrSpan = document.createElement('span');
        arrSpan.style.color = '#ffffff';
        arrSpan.style.fontWeight = 'bold';
        const arrInput = document.createElement('input');
        arrInput.type = 'text';
        arrInput.style.width = '60px';
        arrInput.style.padding = '2px';
        arrInput.style.border = '1px solid #000000';
        arrInput.style.borderRadius = '4px';
        arrInput.style.background = '#111111';
        arrInput.style.color = '#ffffff';
        arrInput.style.outline = 'none';
        blockGameKeysOnInput(arrInput);
        line5.appendChild(arrSpan);
        line5.appendChild(arrInput);

        const eteSpan = document.createElement('span');
        eteSpan.style.color = '#ffffff';
        eteSpan.style.fontWeight = 'bold';
        const eteInput = document.createElement('input');
        eteInput.type = 'text';
        eteInput.style.width = '60px';
        eteInput.style.padding = '2px';
        eteInput.style.border = '1px solid #000000';
        eteInput.style.borderRadius = '4px';
        eteInput.style.background = '#111111';
        eteInput.style.color = '#ffffff';
        eteInput.style.outline = 'none';
        blockGameKeysOnInput(eteInput);
        line5.appendChild(eteSpan);
        line5.appendChild(eteInput);

        const saveBtn = document.createElement('button');
        saveBtn.style.padding = '2px 6px';
        saveBtn.style.fontSize = '11px';
        saveBtn.style.background = '#005500';
        saveBtn.style.color = '#fff';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '4px';
        line5.appendChild(saveBtn);
        panel.appendChild(line5);

        const viewArea = document.createElement('div');
        viewArea.style.display = 'none';
        viewArea.style.flexDirection = 'column';
        viewArea.style.gap = '4px';
        viewArea.style.fontSize = '12px';
        viewArea.style.color = '#fff';

        const vDate = document.createElement('div');
        const vFlight = document.createElement('div');
        const vAc = document.createElement('div');
        const vDep = document.createElement('div');
        const vArr = document.createElement('div');
        const vEte = document.createElement('div');

        viewArea.append(vDate, vFlight, vAc, vDep, vArr, vEte);
        panel.appendChild(viewArea);

        const line6 = document.createElement('div');
        line6.style.textAlign = 'center';
        line6.style.fontSize = '11px';
        line6.style.color = '#ffffff';
        panel.appendChild(line6);

        const line7 = document.createElement('div');
        line7.style.display = 'flex';
        line7.style.justifyContent = 'space-between';
        line7.style.alignItems = 'center';
        line7.style.marginTop = '4px';

        const wishText = document.createElement('div');
        wishText.style.fontSize = '12px';
        wishText.style.fontWeight = '500';
        wishText.style.color = '#ffffff';
        line7.appendChild(wishText);

        const resetBtn = document.createElement('button');
        resetBtn.style.padding = '3px 8px';
        resetBtn.style.fontSize = '12px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.background = '#000000';
        resetBtn.style.color = '#ffffff';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '6px';
        resetBtn.style.fontWeight = 'bold';

        const backBtn = document.createElement('button');
        backBtn.style.padding = '3px 8px';
        backBtn.style.fontSize = '12px';
        backBtn.style.cursor = 'pointer';
        backBtn.style.background = '#000000';
        backBtn.style.color = '#ffffff';
        backBtn.style.border = 'none';
        backBtn.style.borderRadius = '6px';
        backBtn.style.fontWeight = 'bold';
        backBtn.style.display = 'none';

        const closeBtn = document.createElement('button');
        closeBtn.style.padding = '3px 8px';
        closeBtn.style.fontSize = '12px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.background = '#000000';
        closeBtn.style.color = '#ffffff';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.fontWeight = 'bold';

        line7.appendChild(resetBtn);
        line7.appendChild(backBtn);
        line7.appendChild(closeBtn);
        panel.appendChild(line7);

        panel.appendChild(collapse.head);
        panel.appendChild(collapse.body);

        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '6px';
        btnGroup.style.flexWrap = 'wrap';

        const langBtn = document.createElement('button');
        langBtn.style.padding = '3px 6px';
        langBtn.style.fontSize = '11px';
        langBtn.style.cursor = 'pointer';
        langBtn.style.background = '#000000';
        langBtn.style.color = '#ffffff';
        langBtn.style.border = 'none';
        langBtn.style.borderRadius = '6px';
        langBtn.style.fontWeight = 'bold';

        toggleMiniBtn = document.createElement('button');
        toggleMiniBtn.style.padding = '3px 6px';
        toggleMiniBtn.style.fontSize = '11px';
        toggleMiniBtn.style.cursor = 'pointer';
        toggleMiniBtn.style.background = '#000000';
        toggleMiniBtn.style.color = '#ffffff';
        toggleMiniBtn.style.border = 'none';
        toggleMiniBtn.style.borderRadius = '6px';
        toggleMiniBtn.style.fontWeight = 'bold';

        btnGroup.append(langBtn, toggleMiniBtn);
        collapse.body.appendChild(btnGroup);

        // ↓↓↓ 只改了这里：按钮文字 → Geofs FIP ↓↓↓
        miniBtn = document.createElement('button');
        miniBtn.innerText = 'Geofs FIP';
        miniBtn.className = 'mdl-button mdl-js-button geofs-f-standard-ui';
        miniBtn.style.cssText = `
            color: #000;
            background: transparent;
            border: none;
            padding: 0 12px;
            margin: 0;
            height: 100%;
            line-height: normal;
            font-size: 14px;
            font-weight: 500;
            font-family: Roboto, Arial, sans-serif;
            white-space: nowrap;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        `;
        miniBtn.addEventListener('mouseenter', () => miniBtn.style.background = 'rgba(0,0,0,0.05)');
        miniBtn.addEventListener('mouseleave', () => miniBtn.style.background = 'transparent');

        miniBtn.addEventListener('click', () => {
            panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'flex' : 'none';
        });

        waitForBottomBar((bar) => {
            bar.appendChild(miniBtn);
        });

        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'zhCN' : currentLang === 'zhCN' ? 'zhTW' : 'en';
            updateText();
        });

        toggleBtn.addEventListener('click', () => {
            const l = lang[currentLang];
            if (!timerId) {
                toggleBtn.textContent = l.stop;
                flightStatus = 1;
                statusText.textContent = l.status1;
                timerId = setInterval(() => {
                    seconds++;
                    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
                    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
                    const s = String(seconds % 60).padStart(2, '0');
                    timerDisplay.textContent = `${h}:${m}:${s}`;
                }, 1000);
            } else {
                clearInterval(timerId);
                timerId = null;
                toggleBtn.textContent = l.start;
                flightStatus = 2;
                statusText.textContent = l.status2;
            }
        });

        closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });

        resetBtn.addEventListener('click', () => {
            dateInput.value = '';
            flightNoInput.value = '';
            acTypeInput.value = '';
            depInput.value = '';
            arrInput.value = '';
            eteInput.value = '';
            clearInterval(timerId); timerId = null; seconds = 0;
            timerDisplay.textContent = '00:00:00';
            const l = lang[currentLang];
            toggleBtn.textContent = l.start;
            flightStatus = 0;
            statusText.textContent = l.status0;
        });

        toggleMiniBtn.addEventListener('click', () => {
            miniBtnVisible = !miniBtnVisible;
            miniBtn.style.display = miniBtnVisible ? 'inline-flex' : 'none';
            updateText();
        });

        saveBtn.addEventListener('click', () => {
            isViewMode = true;
            line2.style.display = 'none';
            lineDate.style.display = 'none';
            line4.style.display = 'none';
            line5.style.display = 'none';
            line6.style.display = 'none';
            viewArea.style.display = 'flex';
            backBtn.style.display = 'inline-block';
            resetBtn.style.display = 'none';

            const l = lang[currentLang];
            vDate.textContent = l.date + ' ' + dateInput.value;
            vFlight.textContent = l.flightNo + ' ' + flightNoInput.value;
            vAc.textContent = l.acType + ' ' + acTypeInput.value;
            vDep.textContent = l.dep + ' ' + depInput.value;
            vArr.textContent = l.arr + ' ' + arrInput.value;
            vEte.textContent = l.ete + ' ' + eteInput.value;
            updateText();
        });

        backBtn.addEventListener('click', () => {
            isViewMode = false;
            line2.style.display = 'block';
            lineDate.style.display = 'flex';
            line4.style.display = 'flex';
            line5.style.display = 'flex';
            line6.style.display = 'block';
            viewArea.style.display = 'none';
            backBtn.style.display = 'none';
            resetBtn.style.display = 'inline-block';
            updateText();
        });

        document.addEventListener('keydown', (e) => {
            if (window.__geoInputActive) return;
            if (e.key.toLowerCase() === 'k') {
                panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'flex' : 'none';
            }
        });

        updateText();
        document.body.appendChild(panel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startPlugin);
    } else {
        startPlugin();
    }
})();
