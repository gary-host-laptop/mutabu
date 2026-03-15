/* ── THEME ────────────────────────────────────────────────────── */
/* Apply saved theme class on load. Theme is saved as nt_theme.  */
(function() {
    const t = localStorage.getItem('nt_theme') || 'dark';
    document.body.className = document.body.className
        .replace(/\btheme-\S+/g, '').trim();
    document.body.classList.add('theme-' + t);
})();

/* THEMES registry — add new themes here.
   id    = CSS class suffix (body.theme-{id})
   label = display name shown in the picker               */
const THEMES = [
    { id: 'dark',  label: 'dark'  },
    { id: 'light', label: 'light' },
];

/* ── STORAGE ─────────────────────────────────────────────────── */
const Store = {
    async get(key) {
        if (typeof browser !== 'undefined' && browser.storage) {
            const r = await browser.storage.local.get(key);
            return r[key] ?? null;
        }
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
    },
    async set(key, val) {
        if (typeof browser !== 'undefined' && browser.storage) {
            return browser.storage.local.set({ [key]: val });
        }
        localStorage.setItem(key, JSON.stringify(val));
    }
};

/* ── LOCALES ─────────────────────────────────────────────────── */
/* LOCALES sourced from i18n.js — use I18N directly */
const LOCALES = I18N;

/* ── DEFAULTS ────────────────────────────────────────────────── */
const ENGINE_DEFAULTS = [
    { name: 'duckduckgo', url: 'https://duckduckgo.com/?q=',                  isDefault: true  },
    { name: 'youtube',    url: 'https://www.youtube.com/results?search_query=', isDefault: false },
    { name: 'github',     url: 'https://github.com/search?q=',                isDefault: false },
];

/* ── STATE ───────────────────────────────────────────────────── */
let currentTheme  = localStorage.getItem('nt_theme') || 'dark';
let profileImages = []; // array of {id, dataUrl} up to 5
let bgImages      = []; // array of {id, dataUrl} up to 3
let engines       = [];
let clockTheme    = 'theme';
let uiLang        = 'en';
let titleLang     = 'ja';
let userLocation  = { city: '', lat: '', lon: '' };
let username      = '';
let bgBlur        = true;
let searchTarget  = '_blank';
let clockFormat   = '24h';
let clockSeconds  = true;
let jlptLevel     = 'all';
let customQuotes  = null; // null = use defaults

/* ── FONT DEFINITIONS ────────────────────────────────────────── */
const FONTS_LATIN = [
    { id: 'share-tech-mono', name: 'Share Tech Mono', family: "'Share Tech Mono', monospace" },
    { id: 'vt323',           name: 'VT323',           family: "'VT323', monospace" },
    { id: 'courier-prime',   name: 'Courier Prime',   family: "'Courier Prime', monospace" },
];

const FONTS_JP = [
    { id: 'dotgothic16',  name: 'DotGothic16',  family: "'DotGothic16', monospace" },
    { id: 'biz-udgothic', name: 'BIZ UDGothic', family: "'BIZ UDGothic', sans-serif" },
    { id: 'noto-sans-jp', name: 'Noto Sans JP',  family: "'Noto Sans JP', sans-serif" },
];

const FONTS_CLOCK = [
    { id: 'medodica', name: 'Medodica', family: "'Medodica', monospace" },
    { id: 'orbitron', name: 'Orbitron', family: "'Orbitron', monospace" },
    { id: 'oxanium',  name: 'Oxanium',  family: "'Oxanium', monospace" },
];

/* ── FONT STATE ──────────────────────────────────────────────── */
let fontLatin = 'share-tech-mono';
let fontJp    = 'dotgothic16';
let fontClock = 'medodica';

/* ── THEME PICKER ────────────────────────────────────────────── */
function renderTheme() {
    const group = document.getElementById('theme-group');
    if (!group) return;
    group.innerHTML = '';
    THEMES.forEach(theme => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (currentTheme === theme.id ? ' selected' : '');
        btn.textContent = theme.label;
        btn.dataset.value = theme.id;
        btn.addEventListener('click', () => {
            currentTheme = theme.id;
            localStorage.setItem('nt_theme', theme.id);
            document.body.className = document.body.className
                .replace(/\btheme-\S+/g, '').trim();
            document.body.classList.add('theme-' + theme.id);
            group.querySelectorAll('.option-btn').forEach(b =>
                b.classList.toggle('selected', b.dataset.value === theme.id));
        });
        group.appendChild(btn);
    });
}

function renderFontSelect(selectId, fonts, current, onSelect) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    fonts.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name;
        opt.style.fontFamily = f.family;
        opt.selected = current === f.id;
        sel.appendChild(opt);
    });
    // Preview the selected font on the select element itself
    const updatePreview = () => {
        const chosen = fonts.find(f => f.id === sel.value);
        sel.style.fontFamily = chosen ? chosen.family : '';
    };
    updatePreview();
    sel.onchange = () => {
        onSelect(sel.value);
        updatePreview();
        saveSettings();
    };
}

function renderFonts() {
    renderFontSelect('font-latin-select', FONTS_LATIN, fontLatin, v => { fontLatin = v; });
    renderFontSelect('font-jp-select',    FONTS_JP,    fontJp,    v => { fontJp    = v; });
    renderFontSelect('font-clock-select', FONTS_CLOCK, fontClock, v => { fontClock = v; });
}

/* ── WIDGET LAYOUT DEFAULTS ──────────────────────────────────── */
const WIDGET_DEFAULTS = [
    { id: 'quick-access',     col: 'left',   order: 1, visible: true },
    { id: 'timer',            col: 'left',   order: 2, visible: true },
    { id: 'rain',             col: 'left',   order: 3, visible: true },
    { id: 'quote',            col: 'left',   order: 4, visible: true },
    { id: 'bookmarks',        col: 'center', order: 1, visible: true },
    { id: 'notes',            col: 'center', order: 2, visible: true },
    { id: 'recently-visited', col: 'center', order: 3, visible: true },
    { id: 'profile',          col: 'right',  order: 1, visible: true },
    { id: 'status',           col: 'right',  order: 2, visible: true },
    { id: 'kotoba',           col: 'right',  order: 3, visible: true },
];
let widgetLayout = [];

/* ── BACK BUTTON ─────────────────────────────────────────────── */
document.getElementById('back-btn').addEventListener('click', () => {
    if (typeof browser !== 'undefined') {
        browser.tabs.getCurrent().then(tab => {
            browser.tabs.update(tab.id, { url: browser.runtime.getURL('newtab.html') });
        });
    } else {
        history.back();
    }
});

/* ══════════════════════════════════════════════════════════════
   IMAGE UPLOAD HELPER
   ──────────────────────────────────────────────────────────────
   Handles both bg and profile uploads with:
   - 10MB hard file-size gate (before FileReader fires)
   - Canvas resize (caller provides draw function)
   - Iterative JPEG quality reduction if output > 800KB
   - Hard reject if still over limit after 3 passes
   - Inline error display
══════════════════════════════════════════════════════════════ */
const UPLOAD_MAX_FILE_BYTES  = 10 * 1024 * 1024;  // 10MB input gate
const UPLOAD_MAX_OUTPUT_CHARS = 2 * 1024 * 1024;  // ~1.5MB raw image as base64 dataUrl

function showUploadError(errorElId, msg) {
    const el = document.getElementById(errorElId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

/**
 * @param {File}     file         — the File from the input
 * @param {string}   errorElId    — id of the error display element
 * @param {Function} drawFn       — (canvas, imgEl) => void — caller draws onto canvas
 * @param {string}   format       — 'jpeg' or 'png'
 * @returns {Promise<string|null>} dataUrl or null on failure
 */
function processUpload(file, errorElId, drawFn, format = 'jpeg') {
    return new Promise(resolve => {
        if (file.size > UPLOAD_MAX_FILE_BYTES) {
            showUploadError(errorElId, `file too large — max 10MB (this file is ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            return resolve(null);
        }

        const reader = new FileReader();
        reader.onload = ev => {
            const imgEl = new Image();
            imgEl.onload = () => {
                const canvas = document.createElement('canvas');
                drawFn(canvas, imgEl);

                if (format === 'png') {
                    const dataUrl = canvas.toDataURL('image/png');
                    if (dataUrl.length > UPLOAD_MAX_OUTPUT_CHARS) {
                        showUploadError(errorElId, 'image too large after processing — try a smaller file');
                        return resolve(null);
                    }
                    return resolve(dataUrl);
                }

                // JPEG: iterative quality reduction
                const qualities = [0.85, 0.65, 0.45];
                for (const q of qualities) {
                    const dataUrl = canvas.toDataURL('image/jpeg', q);
                    if (dataUrl.length <= UPLOAD_MAX_OUTPUT_CHARS) {
                        return resolve(dataUrl);
                    }
                }
                showUploadError(errorElId, 'image too large after compression — try a smaller or lower-res file');
                resolve(null);
            };
            imgEl.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/* ── BACKGROUND IMAGES ───────────────────────────────────────── */
function renderBgGrid() {
    const grid = document.getElementById('bg-grid');
    grid.innerHTML = '';

    bgImages.forEach((img, i) => {
        const slot = document.createElement('div');
        slot.className = 'bg-slot filled';

        const imgEl = document.createElement('img');
        imgEl.src = img.dataUrl;
        slot.appendChild(imgEl);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'slot-remove';
        removeBtn.textContent = '×';
        removeBtn.title = 'remove';
        removeBtn.addEventListener('click', e => {
            e.stopPropagation();
            bgImages.splice(i, 1);
            renderBgGrid();
            saveSettings();
        });
        slot.appendChild(removeBtn);
        grid.appendChild(slot);
    });

    if (bgImages.length < 3) {
        const slot = document.createElement('div');
        slot.className = 'bg-slot';

        const plus = document.createElement('div');
        plus.className = 'slot-plus';
        plus.textContent = '+';
        slot.appendChild(plus);

        const label = document.createElement('div');
        label.className = 'slot-label';
        label.textContent = 'add image';
        slot.appendChild(label);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            const dataUrl = await processUpload(
                file,
                'bg-upload-error',
                (canvas, imgEl) => {
                    const maxW = 1920, maxH = 1080;
                    const scale = Math.min(1, maxW / imgEl.width, maxH / imgEl.height);
                    canvas.width  = Math.round(imgEl.width  * scale);
                    canvas.height = Math.round(imgEl.height * scale);
                    canvas.getContext('2d').drawImage(imgEl, 0, 0, canvas.width, canvas.height);
                },
                'jpeg'
            );
            if (!dataUrl) return;
            bgImages.push({ id: Date.now(), dataUrl });
            renderBgGrid();
            saveSettings();
        });
        slot.appendChild(fileInput);

        // Click slot → trigger hidden file input
        slot.addEventListener('click', () => fileInput.click());

        grid.appendChild(slot);
    }
}

/* ── LANGUAGE ────────────────────────────────────────────────── */
function renderLangGroup(groupId, current, onSelect) {
    const group = document.getElementById(groupId);
    group.innerHTML = '';
    Object.entries(LOCALES).forEach(([code, locale]) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (current === code ? ' selected' : '');
        btn.textContent = locale.name;
        btn.dataset.value = code;
        btn.addEventListener('click', () => {
            onSelect(code);
            renderLangGroup(groupId, code, onSelect);
            renderLayoutTable();
            saveSettings();
        });
        group.appendChild(btn);
    });
}

function renderLanguage() {
    // UI language — select dropdown (English only for now, infrastructure for future)
    const uiSel = document.getElementById('ui-lang-select');
    if (uiSel) {
        Array.from(uiSel.options).forEach(opt => { opt.selected = opt.value === uiLang; });
        uiSel.onchange = () => {
            uiLang = uiSel.value;
            saveSettings();
        };
    }
    // Widget title language — toggle buttons
    renderLangGroup('title-lang-group', titleLang, v => { titleLang = v; });
}

/* ── WIDGET LAYOUT ───────────────────────────────────────────── */
function renderLayoutTable() {
    const tbody = document.getElementById('layout-tbody');
    tbody.innerHTML = '';
    // Always use English in the settings table regardless of titleLang
    const widgetNames = LOCALES['en'].widgets;

    widgetLayout.forEach((w, i) => {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = widgetNames[w.id] || w.id;
        tr.appendChild(tdName);

        const tdCol = document.createElement('td');
        const colSel = document.createElement('select');
        colSel.className = 'layout-select';
        ['left', 'center', 'right'].forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.textContent = c;
            if (w.col === c) opt.selected = true;
            colSel.appendChild(opt);
        });
        colSel.addEventListener('change', () => { widgetLayout[i].col = colSel.value; saveSettings(); });
        tdCol.appendChild(colSel);
        tr.appendChild(tdCol);

        const tdOrd = document.createElement('td');
        const ordSel = document.createElement('select');
        ordSel.className = 'layout-select';
        for (let n = 1; n <= 10; n++) {
            const opt = document.createElement('option');
            opt.value = n; opt.textContent = n;
            if (w.order === n) opt.selected = true;
            ordSel.appendChild(opt);
        }
        ordSel.addEventListener('change', () => { widgetLayout[i].order = parseInt(ordSel.value); saveSettings(); });
        tdOrd.appendChild(ordSel);
        tr.appendChild(tdOrd);

        // Visible toggle
        const tdVis = document.createElement('td');
        const visBtn = document.createElement('button');
        visBtn.className = 'option-btn' + (w.visible !== false ? ' selected' : '');
        visBtn.textContent = w.visible !== false ? 'on' : 'off';
        visBtn.addEventListener('click', () => {
            widgetLayout[i].visible = !widgetLayout[i].visible;
            visBtn.classList.toggle('selected', widgetLayout[i].visible);
            visBtn.textContent = widgetLayout[i].visible ? 'on' : 'off';
            saveSettings();
        });
        tdVis.appendChild(visBtn);
        tr.appendChild(tdVis);

        tbody.appendChild(tr);
    });
}

/* ── CLOCK THEME ─────────────────────────────────────────────── */
function renderClockTheme() {
    document.querySelectorAll('#clock-theme-group .option-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === clockTheme);
    });
}

document.querySelectorAll('#clock-theme-group .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        clockTheme = btn.dataset.value;
        renderClockTheme();
        saveSettings();
    });
});

/* ── PROFILE IMAGES ──────────────────────────────────────────── */
function renderProfileGrid() {
    const grid = document.getElementById('profile-grid');
    grid.innerHTML = '';

    // Render filled slots
    profileImages.forEach((img, i) => {
        const slot = document.createElement('div');
        slot.className = 'profile-slot filled';

        const imgEl = document.createElement('img');
        imgEl.src = img.dataUrl;
        slot.appendChild(imgEl);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'slot-remove';
        removeBtn.textContent = '×';
        removeBtn.title = 'remove';
        removeBtn.addEventListener('click', e => {
            e.stopPropagation();
            profileImages.splice(i, 1);
            renderProfileGrid();
            saveSettings();
        });
        slot.appendChild(removeBtn);
        grid.appendChild(slot);
    });

    // Render empty add slot if under 5
    if (profileImages.length < 5) {
        const slot = document.createElement('div');
        slot.className = 'profile-slot';

        const plus = document.createElement('div');
        plus.className = 'slot-plus';
        plus.textContent = '+';
        slot.appendChild(plus);

        const label = document.createElement('div');
        label.className = 'slot-label';
        label.textContent = 'add image';
        slot.appendChild(label);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            const dataUrl = await processUpload(
                file,
                'profile-upload-error',
                (canvas, imgEl) => {
                    // Square crop from center, resize to 100×100
                    const size   = Math.min(imgEl.width, imgEl.height);
                    const sx     = (imgEl.width  - size) / 2;
                    const sy     = (imgEl.height - size) / 2;
                    const outSize = Math.min(size, 100);
                    canvas.width  = outSize;
                    canvas.height = outSize;
                    canvas.getContext('2d').drawImage(imgEl, sx, sy, size, size, 0, 0, outSize, outSize);
                },
                'png'
            );
            if (!dataUrl) return;
            profileImages.push({ id: Date.now(), dataUrl });
            renderProfileGrid();
            saveSettings();
        });
        slot.appendChild(fileInput);

        // Click slot → trigger hidden file input
        slot.addEventListener('click', () => fileInput.click());

        grid.appendChild(slot);
    }
}

/* ── SEARCH ENGINES ──────────────────────────────────────────── */
function renderEngineList() {
    const list = document.getElementById('engine-list');
    list.innerHTML = '';

    engines.forEach((eng, i) => {
        const row = document.createElement('div');
        row.className = 'engine-row' + (eng.isDefault ? ' is-default' : '');
        row.style.flexWrap = 'wrap';

        const info = document.createElement('div');
        info.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;';

        const name = document.createElement('span');
        name.className = 'engine-name';
        name.textContent = eng.name + (eng.isDefault ? ' · default' : '');
        info.appendChild(name);

        const url = document.createElement('span');
        url.className = 'engine-url';
        url.style.whiteSpace = 'nowrap';
        url.style.overflow = 'hidden';
        url.style.textOverflow = 'ellipsis';
        url.textContent = eng.url;
        info.appendChild(url);

        row.appendChild(info);

        // Stacked buttons: ✎ on top, × below (+ set default if applicable)
        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex-shrink:0;';

        const edit = document.createElement('button');
        edit.className = 'btn';
        edit.textContent = '✎';
        edit.title = 'edit';
        edit.style.fontSize = '11px';
        edit.style.padding = '2px 7px';
        edit.addEventListener('click', () => {
            row.innerHTML = '';
            row.style.flexDirection = 'column';
            row.style.gap = '8px';

            const editName = document.createElement('input');
            editName.type = 'text';
            editName.value = eng.name;
            editName.placeholder = 'name';
            editName.style.cssText = 'background:var(--panel2);border:1px solid var(--border);color:var(--white);font-family:var(--font-pixel);font-size:11px;padding:5px 8px;outline:none;width:100%;';

            const editUrl = document.createElement('input');
            editUrl.type = 'text';
            editUrl.value = eng.url;
            editUrl.placeholder = 'url';
            editUrl.style.cssText = editName.style.cssText;

            const editBtns = document.createElement('div');
            editBtns.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;';

            const cancel = document.createElement('button');
            cancel.className = 'btn';
            cancel.textContent = 'cancel';
            cancel.addEventListener('click', () => renderEngineList());

            const save = document.createElement('button');
            save.className = 'btn primary';
            save.textContent = 'save';
            save.addEventListener('click', () => {
                const n = editName.value.trim();
                const u = editUrl.value.trim();
                if (!n || !u) return;
                engines[i].name = n;
                engines[i].url  = u;
                renderEngineList();
                saveSettings();
            });

            editBtns.appendChild(cancel);
            editBtns.appendChild(save);
            row.appendChild(editName);
            row.appendChild(editUrl);
            row.appendChild(editBtns);
        });
        btns.appendChild(edit);

        if (!eng.isDefault) {
            const setDefault = document.createElement('button');
            setDefault.className = 'btn';
            setDefault.textContent = '★';
            setDefault.title = 'set as default';
            setDefault.style.fontSize = '11px';
            setDefault.style.padding = '2px 7px';
            setDefault.addEventListener('click', () => {
                engines.forEach(e => e.isDefault = false);
                engines[i].isDefault = true;
                renderEngineList();
                saveSettings();
            });
            btns.appendChild(setDefault);
        }

        if (engines.length > 1) {
            const del = document.createElement('button');
            del.className = 'btn danger';
            del.textContent = '×';
            del.title = 'remove';
            del.style.fontSize = '11px';
            del.style.padding = '2px 7px';
            del.addEventListener('click', () => {
                const wasDefault = engines[i].isDefault;
                engines.splice(i, 1);
                if (wasDefault && engines.length > 0) engines[0].isDefault = true;
                renderEngineList();
                saveSettings();
            });
            btns.appendChild(del);
        }

        row.appendChild(btns);
        list.appendChild(row);
    });
}

/* Add engine form */
document.getElementById('add-engine-btn').addEventListener('click', () => {
    document.getElementById('add-engine-form').classList.add('visible');
    document.getElementById('new-engine-name').focus();
});

document.getElementById('cancel-engine-btn').addEventListener('click', () => {
    document.getElementById('add-engine-form').classList.remove('visible');
    document.getElementById('new-engine-name').value = '';
    document.getElementById('new-engine-url').value = '';
});

document.getElementById('save-engine-btn').addEventListener('click', () => {
    const name = document.getElementById('new-engine-name').value.trim();
    const url  = document.getElementById('new-engine-url').value.trim();
    if (!name || !url) return;
    engines.push({ name, url, isDefault: engines.length === 0 });
    document.getElementById('add-engine-form').classList.remove('visible');
    document.getElementById('new-engine-name').value = '';
    document.getElementById('new-engine-url').value = '';
    renderEngineList();
});

/* ── LOCATION ────────────────────────────────────────────────── */
function renderLocation() {
    document.getElementById('location-city').value = userLocation.city || '';
    document.getElementById('location-lat').value  = userLocation.lat  || '';
    document.getElementById('location-lon').value  = userLocation.lon  || '';
    if (userLocation.lat && userLocation.lon) {
        document.getElementById('location-result').style.display = 'block';
        document.getElementById('location-status').textContent =
            userLocation.city ? `using: ${userLocation.city}` : 'coordinates set manually';
        document.getElementById('location-status').style.color = 'var(--accent3)';
    }
}

document.getElementById('location-lookup-btn').addEventListener('click', async () => {
    const city = document.getElementById('location-city').value.trim();
    if (!city) return;
    const status = document.getElementById('location-status');
    status.textContent = 'looking up...';
    status.style.color = 'var(--dimmer)';
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
            status.textContent = 'city not found — try a different name';
            status.style.color = 'var(--accent2)';
            return;
        }
        const r = data.results[0];
        userLocation.city = r.name + (r.country ? `, ${r.country}` : '');
        userLocation.lat  = r.latitude.toFixed(4);
        userLocation.lon  = r.longitude.toFixed(4);
        document.getElementById('location-lat').value = userLocation.lat;
        document.getElementById('location-lon').value = userLocation.lon;
        document.getElementById('location-result').style.display = 'block';
        status.textContent = `found: ${userLocation.city}`;
        status.style.color = 'var(--accent3)';
        saveSettings();
    } catch(e) {
        status.textContent = 'lookup failed — check your connection';
        status.style.color = 'var(--accent2)';
    }
});

// Allow manual lat/lon edits
document.getElementById('location-lat').addEventListener('input', e => { userLocation.lat = e.target.value.trim(); });
document.getElementById('location-lon').addEventListener('input', e => { userLocation.lon = e.target.value.trim(); });

/* ── SIMPLE TOGGLE HELPER ────────────────────────────────────── */
function renderToggleGroup(groupId, current, onChange) {
    document.querySelectorAll(`#${groupId} .option-btn`).forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === String(current));
        btn.addEventListener('click', () => {
            const val = btn.dataset.value;
            onChange(val);
            document.querySelectorAll(`#${groupId} .option-btn`).forEach(b =>
                b.classList.toggle('selected', b.dataset.value === val));
            saveSettings();
        });
    });
}

/* ── BACKGROUND BLUR ─────────────────────────────────────────── */
function renderBgBlur() {
    renderToggleGroup('bg-blur-group', bgBlur, v => { bgBlur = v === 'true'; });
}

/* ── SEARCH TARGET ───────────────────────────────────────────── */
function renderSearchTarget() {
    renderToggleGroup('search-target-group', searchTarget, v => { searchTarget = v; });
}

/* ── CLOCK FORMAT AND SECONDS ────────────────────────────────── */
function renderClockDisplay() {
    renderToggleGroup('clock-format-group',  clockFormat,   v => { clockFormat  = v; });
    renderToggleGroup('clock-seconds-group', clockSeconds,  v => { clockSeconds = v === 'true'; });
}

/* ── JLPT FILTER ─────────────────────────────────────────────── */
function renderJlpt() {
    renderToggleGroup('jlpt-group', jlptLevel, v => { jlptLevel = v; });
}

/* ── QUOTES ──────────────────────────────────────────────────── */
/* QUOTE_DEFAULTS — use QUOTES from data/quotes.js */
const QUOTE_DEFAULTS = QUOTES;
const MAX_QUOTES = 10;

function renderQuoteList() {
    const list   = document.getElementById('quote-list');
    const addBtn = document.getElementById('add-quote-btn');
    const countEl = document.getElementById('quote-count');
    list.innerHTML = '';
    const quotes = customQuotes || QUOTE_DEFAULTS;
    const atMax  = quotes.length >= MAX_QUOTES;

    // Update count label
    countEl.textContent = atMax ? `${quotes.length}/${MAX_QUOTES} · limit reached` : `${quotes.length}/${MAX_QUOTES}`;
    countEl.style.color = atMax ? 'var(--accent2)' : 'var(--dimmer)';

    quotes.forEach((q, i) => {
        const row = document.createElement('div');
        row.className = 'engine-row';
        row.style.flexDirection = 'column';
        row.style.alignItems = 'flex-start';
        row.style.gap = '4px';

        const top = document.createElement('div');
        top.style.cssText = 'display:flex;align-items:flex-start;gap:8px;width:100%';

        const textEl = document.createElement('span');
        textEl.className = 'engine-url';
        textEl.style.flex = '1';
        textEl.style.whiteSpace = 'normal';
        textEl.textContent = `"${q.text}"`;
        top.appendChild(textEl);

        // Edit + delete buttons
        const btns = document.createElement('div');
        btns.style.cssText = 'display:flex;flex-direction:column;gap:3px;flex-shrink:0;';

        const edit = document.createElement('button');
        edit.className = 'btn';
        edit.textContent = '✎';
        edit.title = 'edit';
        edit.style.fontSize = '11px';
        edit.style.padding = '2px 7px';
        edit.addEventListener('click', () => {
            // Inline edit: replace row with editable fields
            if (!customQuotes) customQuotes = [...QUOTE_DEFAULTS];
            row.innerHTML = '';
            row.style.gap = '8px';

            const editText = document.createElement('input');
            editText.type = 'text';
            editText.value = q.text;
            editText.style.cssText = 'background:var(--panel2);border:1px solid var(--border);color:var(--white);font-family:var(--font-pixel);font-size:11px;padding:5px 8px;outline:none;width:100%;';
            row.appendChild(editText);

            const editAuthor = document.createElement('input');
            editAuthor.type = 'text';
            editAuthor.value = q.author;
            editAuthor.placeholder = 'author';
            editAuthor.style.cssText = editText.style.cssText;
            row.appendChild(editAuthor);

            const editBtns = document.createElement('div');
            editBtns.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;';

            const cancelEdit = document.createElement('button');
            cancelEdit.className = 'btn';
            cancelEdit.textContent = 'cancel';
            cancelEdit.addEventListener('click', () => renderQuoteList());

            const saveEdit = document.createElement('button');
            saveEdit.className = 'btn primary';
            saveEdit.textContent = 'save';
            saveEdit.addEventListener('click', () => {
                const newText = editText.value.trim();
                if (!newText) return;
                customQuotes[i] = { text: newText, author: editAuthor.value.trim() || 'unknown' };
                renderQuoteList();
                saveSettings();
            });

            editBtns.appendChild(cancelEdit);
            editBtns.appendChild(saveEdit);
            row.appendChild(editBtns);
        });
        btns.appendChild(edit);

        const del = document.createElement('button');
        del.className = 'btn danger';
        del.textContent = '×';
        del.title = 'delete';
        del.style.fontSize = '11px';
        del.style.padding = '2px 7px';
        del.addEventListener('click', () => {
            if (!customQuotes) customQuotes = [...QUOTE_DEFAULTS];
            customQuotes.splice(i, 1);
            renderQuoteList();
            saveSettings();
        });
        btns.appendChild(del);

        top.appendChild(btns);
        row.appendChild(top);

        const author = document.createElement('span');
        author.style.cssText = 'font-size:10px;color:var(--accent);letter-spacing:1px;';
        author.textContent = '— ' + q.author;
        row.appendChild(author);

        list.appendChild(row);
    });

    // Hide/show add button
    addBtn.style.display = atMax ? 'none' : '';
}

// Manage toggle
document.getElementById('quote-manage-btn').addEventListener('click', () => {
    const panel = document.getElementById('quote-panel');
    const btn   = document.getElementById('quote-manage-btn');
    const open  = panel.style.display === 'none';
    panel.style.display = open ? 'block' : 'none';
    btn.textContent = open ? 'close ×' : 'manage ›';
});

document.getElementById('add-quote-btn').addEventListener('click', () => {
    const quotes = customQuotes || QUOTE_DEFAULTS;
    if (quotes.length >= MAX_QUOTES) return;
    document.getElementById('add-quote-form').classList.add('visible');
    document.getElementById('new-quote-text').focus();
});

document.getElementById('cancel-quote-btn').addEventListener('click', () => {
    document.getElementById('add-quote-form').classList.remove('visible');
    document.getElementById('new-quote-text').value = '';
    document.getElementById('new-quote-author').value = '';
});

document.getElementById('save-quote-btn').addEventListener('click', () => {
    const text   = document.getElementById('new-quote-text').value.trim();
    const author = document.getElementById('new-quote-author').value.trim();
    if (!text) return;
    if (!customQuotes) customQuotes = [...QUOTE_DEFAULTS];
    if (customQuotes.length >= MAX_QUOTES) return;
    customQuotes.push({ text, author: author || 'unknown' });
    document.getElementById('add-quote-form').classList.remove('visible');
    document.getElementById('new-quote-text').value = '';
    document.getElementById('new-quote-author').value = '';
    renderQuoteList();
    saveSettings();
});

/* ── EXPORT / IMPORT / RESET ─────────────────────────────────── */
function getAllSettings() {
    return {
        nt_profile_images: profileImages,
        nt_bg_images:      bgImages,
        nt_engines:        engines,
        nt_clock_theme:    clockTheme,
        nt_widget_layout:  widgetLayout,
        nt_ui_lang:        uiLang,
        nt_title_lang:     titleLang,
        nt_location:       userLocation,
        nt_username:       document.getElementById('username-input').value.trim(),
        nt_font_latin:     fontLatin,
        nt_font_jp:        fontJp,
        nt_font_clock:     fontClock,
        nt_bg_blur:        bgBlur,
        nt_search_target:  searchTarget,
        nt_clock_format:   clockFormat,
        nt_clock_seconds:  clockSeconds,
        nt_jlpt_level:     jlptLevel,
        nt_custom_quotes:  customQuotes,
    };
}

document.getElementById('export-btn').addEventListener('click', () => {
    const data = JSON.stringify(getAllSettings(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'mutabu-settings.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const status = document.getElementById('data-status');
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        for (const [key, val] of Object.entries(data)) {
            await Store.set(key, val);
        }
        status.textContent = '✓ settings imported — reloading...';
        status.style.color = 'var(--accent3)';
        setTimeout(() => window.location.reload(), 1000);
    } catch(err) {
        status.textContent = '× invalid file';
        status.style.color = 'var(--accent2)';
    }
    e.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    const keys = Object.keys(getAllSettings());
    for (const key of keys) {
        if (typeof browser !== 'undefined' && browser.storage) {
            await browser.storage.local.remove(key);
        } else {
            localStorage.removeItem(key);
        }
    }
    const status = document.getElementById('data-status');
    status.textContent = '✓ reset complete — reloading...';
    status.style.color = 'var(--accent3)';
    setTimeout(() => window.location.reload(), 1000);
});

/* ── SAVE ────────────────────────────────────────────────────── */
async function saveSettings() {
    const data = {
        nt_profile_images: profileImages,
        nt_bg_images:      bgImages,
        nt_engines:        engines,
        nt_clock_theme:    clockTheme,
        nt_widget_layout:  widgetLayout,
        nt_ui_lang:        uiLang,
        nt_title_lang:     titleLang,
        nt_location:       userLocation,
        nt_username:       document.getElementById('username-input').value.trim(),
        nt_font_latin:     fontLatin,
        nt_font_jp:        fontJp,
        nt_font_clock:     fontClock,
        nt_bg_blur:        bgBlur,
        nt_search_target:  searchTarget,
        nt_clock_format:   clockFormat,
        nt_clock_seconds:  clockSeconds,
        nt_jlpt_level:     jlptLevel,
        nt_custom_quotes:  customQuotes,
    };
    if (typeof browser !== 'undefined' && browser.storage) {
        await browser.storage.local.set(data);
    } else {
        for (const [key, val] of Object.entries(data)) {
            localStorage.setItem(key, JSON.stringify(val));
        }
    }
}

/* ── INIT ────────────────────────────────────────────────────── */
async function init() {
    profileImages = (await Store.get('nt_profile_images')) || [];
    bgImages      = (await Store.get('nt_bg_images'))      || [];
    engines       = (await Store.get('nt_engines'))        || ENGINE_DEFAULTS.map(e => ({...e}));
    clockTheme    = (await Store.get('nt_clock_theme'))    || 'theme';
    widgetLayout  = (await Store.get('nt_widget_layout'))  || WIDGET_DEFAULTS.map(w => ({...w}));
    uiLang        = (await Store.get('nt_ui_lang'))        || 'en';
    titleLang     = (await Store.get('nt_title_lang'))     || 'ja';
    userLocation = (await Store.get('nt_location')) || { city: '', lat: '', lon: '' };
    username     = (await Store.get('nt_username')) || '';
    fontLatin    = (await Store.get('nt_font_latin')) || 'share-tech-mono';
    fontJp       = (await Store.get('nt_font_jp'))    || 'dotgothic16';
    fontClock    = (await Store.get('nt_font_clock')) || 'medodica';
    bgBlur       = (await Store.get('nt_bg_blur'))       ?? true;
    searchTarget = (await Store.get('nt_search_target')) || '_blank';
    clockFormat  = (await Store.get('nt_clock_format'))  || '24h';
    clockSeconds = (await Store.get('nt_clock_seconds')) ?? true;
    jlptLevel    = (await Store.get('nt_jlpt_level'))    || 'all';
    customQuotes = (await Store.get('nt_custom_quotes')) ?? null;
    document.getElementById('username-input').value = username;
    // Auto-save username after user stops typing
    let _usernameTimer;
    document.getElementById('username-input').addEventListener('input', () => {
        clearTimeout(_usernameTimer);
        _usernameTimer = setTimeout(() => saveSettings(), 800);
    });
    renderTheme();
    renderProfileGrid();
    renderBgGrid();
    renderFonts();
    renderLanguage();
    renderClockTheme();
    renderClockDisplay();
    renderBgBlur();
    renderSearchTarget();
    renderJlpt();
    renderQuoteList();
    renderLayoutTable();
    renderEngineList();
    renderLocation();
}

init();