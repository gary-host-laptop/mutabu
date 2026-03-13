/* ── TIMER ───────────────────────────────────────────────────── */
(function() {
    const display   = document.getElementById('timer-display');
    const minInput  = document.getElementById('timer-min');
    const secInput  = document.getElementById('timer-sec');
    const startBtn  = document.getElementById('timer-start');
    const resetBtn  = document.getElementById('timer-reset');
    const alarm     = new Audio('sounds/alarm.mp3');

    let total    = 0;
    let remaining = 0;
    let interval = null;
    let running  = false;

    function pad(n) { return String(n).padStart(2, '0'); }

    function render(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        display.textContent = `${pad(m)}:${pad(s)}`;
        display.classList.toggle('urgent', secs <= 10 && secs > 0);
    }

    function stop() {
        clearInterval(interval);
        interval = null;
        running  = false;
        startBtn.querySelector('i').className = 'ph-light ph-play';
        startBtn.classList.remove('active');
        minInput.disabled = false;
        secInput.disabled = false;
    }

    startBtn.addEventListener('click', () => {
        if (running) { stop(); return; }
        const m = parseInt(minInput.value) || 0;
        const s = parseInt(secInput.value) || 0;
        total = m * 60 + s;
        if (total <= 0) return;
        remaining = total;
        render(remaining);
        minInput.disabled = true;
        secInput.disabled = true;
        startBtn.querySelector('i').className = 'ph-light ph-pause';
        startBtn.classList.add('active');
        running = true;
        interval = setInterval(() => {
            remaining--;
            render(remaining);
            if (remaining <= 0) {
                stop();
                alarm.currentTime = 0;
                alarm.play();
                display.classList.add('urgent');
            }
        }, 1000);
    });

    resetBtn.addEventListener('click', () => {
        stop();
        alarm.pause();
        alarm.currentTime = 0;
        remaining = 0;
        render(0);
        minInput.value = 0;
        secInput.value = 0;
        display.classList.remove('urgent');
    });
})();

/* ── RAIN PLAYER ────────────────────────────────────────────── */
(function() {
    const tracks = {
        rain:    { file: 'sounds/heavy-rain.mp3', loop: true,  id: 'vol-rain' },
        wind:    { file: 'sounds/wind.mp3',        loop: true,  id: 'vol-wind' },
        thunder: { file: 'sounds/thunder.mp3',     loop: false, id: 'vol-thunder' },
    };

    // Create audio elements
    Object.values(tracks).forEach(t => {
        t.audio = new Audio(t.file);
        t.audio.loop = t.loop;
        t.audio.volume = parseFloat(document.getElementById(t.id).value);
    });

    let playing = false;

    // Thunder fires randomly every 20–60s when playing
    let thunderTimer = null;
    function scheduleThunder() {
        const delay = 20000 + Math.random() * 40000;
        thunderTimer = setTimeout(() => {
            if (!playing) return;
            const a = tracks.thunder.audio;
            a.currentTime = 0;
            a.play();
            scheduleThunder();
        }, delay);
    }

    const btn = document.getElementById('rain-btn');

    btn.addEventListener('click', () => {
        if (!playing) {
            tracks.rain.audio.play();
            tracks.wind.audio.play();
            scheduleThunder();
            btn.querySelector('i').className = 'ph-light ph-stop';
            btn.classList.add('playing');
            playing = true;
        } else {
            tracks.rain.audio.pause();
            tracks.wind.audio.pause();
            tracks.thunder.audio.pause();
            clearTimeout(thunderTimer);
            btn.querySelector('i').className = 'ph-light ph-play';
            btn.classList.remove('playing');
            playing = false;
        }
    });

    // Master volume
    let masterVol = 1;
    document.getElementById('vol-master').addEventListener('input', e => {
        masterVol = parseFloat(e.target.value);
        Object.values(tracks).forEach(t => {
            const trackVol = parseFloat(document.getElementById(t.id).value);
            t.audio.volume = trackVol * masterVol;
        });
    });

    // Volume sliders
    Object.entries(tracks).forEach(([key, t]) => {
        document.getElementById(t.id).addEventListener('input', e => {
            t.audio.volume = parseFloat(e.target.value) * masterVol;
        });
    });
})();

/* ── PROFILE IMAGE ROTATION handled by applySettings below ─────── */

/* ── CLOCK ──────────────────────────────────────────────────── */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* getGreetingStrings() is provided by i18n.js */

function pad(n) { return String(n).padStart(2,'0'); }

function getWeekNum(d) {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

function getYearProgress(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    const end   = new Date(d.getFullYear() + 1, 0, 0);
    const pct   = ((d - start) / (end - start) * 100).toFixed(1);
    return pct + '%';
}

let greetingSet = null;
let lastHour   = -1;

function setGreeting(el, text) {
    if (!el) return;
    el.textContent = text;
    const accents = ['--accent', '--accent2', '--accent3', '--red'];
    const chosen = accents[Math.floor(Math.random() * accents.length)];
    const val = `var(${chosen})`;
    el.style.color = val;
    const usernameEl = document.getElementById('username');
    if (usernameEl) usernameEl.style.color = val;
    document.documentElement.style.setProperty('--greeting-accent', val);
}

let binaryClock = false;

/* ── DRAG AND DROP SORT ─────────────────────────────────────── */
function enableDragSort(container, itemSelector, getData, setData, reload) {
    let dragSrc = null;
    container.addEventListener('dragstart', e => {
        if (!document.body.classList.contains('edit-mode')) return;
        const item = e.target.closest(itemSelector);
        if (!item) return;
        dragSrc = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    container.addEventListener('dragover', e => {
        if (!dragSrc) return;
        const item = e.target.closest(itemSelector);
        if (!item || item === dragSrc) return;
        e.preventDefault();
        container.querySelectorAll(itemSelector).forEach(el => el.classList.remove('drag-over'));
        item.classList.add('drag-over');
    });
    container.addEventListener('dragleave', e => {
        if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
            container.querySelectorAll(itemSelector).forEach(el => el.classList.remove('drag-over'));
        }
    });
    container.addEventListener('drop', async e => {
        e.preventDefault();
        const target = e.target.closest(itemSelector);
        if (!target || !dragSrc || target === dragSrc) return;
        const srcIdx = parseInt(dragSrc.dataset.dragIndex);
        const tgtIdx = parseInt(target.dataset.dragIndex);
        const arr = await getData();
        const [moved] = arr.splice(srcIdx, 1);
        arr.splice(tgtIdx, 0, moved);
        await setData(arr);
        dragSrc = null;
        reload();
    });
    container.addEventListener('dragend', () => {
        container.querySelectorAll(itemSelector).forEach(el => el.classList.remove('dragging', 'drag-over'));
        dragSrc = null;
    });
}

function renderBinaryGroup(val) {
    // 6 bits: top row = bits 5,4 | bottom row = bits 3,2,1,0
    const group = document.createElement('div');
    group.className = 'bin-group';
    const bits = [];
    for (let i = 5; i >= 0; i--) bits.push((val >> i) & 1);
    // Row 1: bits[0], bits[1], then 2 empty spacers
    bits.slice(0, 2).forEach(b => {
        const d = document.createElement('div');
        d.className = 'bin-bit' + (b ? ' on' : '');
        group.appendChild(d);
    });
    // 2 empty cells to complete row 1
    for (let i = 0; i < 2; i++) {
        const e = document.createElement('div');
        e.className = 'bin-empty';
        group.appendChild(e);
    }
    // Row 2: bits[2..5]
    bits.slice(2).forEach(b => {
        const d = document.createElement('div');
        d.className = 'bin-bit' + (b ? ' on' : '');
        group.appendChild(d);
    });
    return group;
}

function renderBinary(h, m, s) {
    // h should always be 24h (0-23) — binary clocks don't use 12h
    // s === null means hide seconds
    const el = document.getElementById('clock');
    el.innerHTML = '';

    el.appendChild(renderBinaryGroup(h));

    const sep1 = document.createElement('span');
    sep1.className = 'bin-sep'; sep1.textContent = ':';
    el.appendChild(sep1);

    el.appendChild(renderBinaryGroup(m));

    if (s !== null) {
        const sep2 = document.createElement('span');
        sep2.className = 'bin-sep'; sep2.textContent = ':';
        el.appendChild(sep2);
        el.appendChild(renderBinaryGroup(s));
    }
}

document.getElementById('clock').addEventListener('click', () => {
    binaryClock = !binaryClock;
    const el = document.getElementById('clock');
    el.classList.toggle('binary', binaryClock);
    if (!binaryClock) el.innerHTML = '';
});

// Defaults — applySettings will overwrite these from storage.
// Set before tick() so the very first render is already correct.
window._clockFormat  = '24h';
window._clockSeconds = true;

function tick() {
    const now = new Date();
    const rawH = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();

    if (binaryClock) {
        // Binary always uses 24h raw hours; pass null for s when hiding seconds
        renderBinary(rawH, m, window._clockSeconds ? s : null);
    } else {
        let h = rawH;
        let suffix = '';
        if (window._clockFormat === '12h') {
            suffix = h >= 12 ? ' PM' : ' AM';
            h = h % 12 || 12;
        }
        document.getElementById('clock').textContent = window._clockSeconds
            ? `${pad(h)}:${pad(m)}:${pad(s)}${suffix}`
            : `${pad(h)}:${pad(m)}${suffix}`;
    }

    if (rawH !== lastHour) {
        lastHour = rawH;
        greetingSet = getGreetingStrings(rawH, window._uiLang || 'en');
        setGreeting(document.getElementById('greeting'),
            greetingSet[Math.floor(Math.random() * greetingSet.length)]);

        document.getElementById('date').textContent =
            `${DAYS[now.getDay()].toUpperCase()} · ${MONTHS[now.getMonth()].toUpperCase()} ${now.getDate()} · ${now.getFullYear()}`;

        document.getElementById('day-name').textContent  = DAYS[now.getDay()];
        document.getElementById('week-num').textContent  = `W${pad(getWeekNum(now))}`;
        document.getElementById('year-progress').textContent = getYearProgress(now);
    }
}
window._tickInterval = setInterval(tick, 1000);
tick();

/* ── SEARCH ─────────────────────────────────────────────────── */
let activeEngine = document.querySelector('.engine-btn.active');

document.querySelectorAll('.engine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.engine-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeEngine = btn;
    });
});

document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (!q) return;
        const url = activeEngine.dataset.url + encodeURIComponent(q);
        window.open(url, '_blank');
        e.target.value = '';
    }
});

/* ── NOTES ──────────────────────────────────────────────────── */
const notesEl = document.getElementById('notes');
notesEl.value = localStorage.getItem('nt_notes') || '';
notesEl.addEventListener('input', () => localStorage.setItem('nt_notes', notesEl.value));
document.getElementById('notes-clear').addEventListener('click', () => {
    if (confirm('clear notes?')) {
        notesEl.value = '';
        localStorage.removeItem('nt_notes');
    }
});

/* ── STORAGE HELPER ─────────────────────────────────────────────
   Falls back to localStorage if browser.storage is unavailable
   (e.g. when previewing as plain HTML outside the extension).    */
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

/* ── CONTEXT MENU ───────────────────────────────────────────────
   Usage: CtxMenu.show(e, [ {label, action, danger?} ])           */
const CtxMenu = (() => {
    const el = document.getElementById('ctx-menu');

    document.addEventListener('click', () => hide());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });

    function hide() { el.classList.remove('visible'); el.innerHTML = ''; }

    function show(e, items) {
        e.preventDefault();
        e.stopPropagation();
        hide();
        items.forEach(({ label, action, danger }) => {
            const div = document.createElement('div');
            div.className = 'ctx-item' + (danger ? ' danger' : '');
            div.textContent = label;
            div.addEventListener('click', () => { hide(); action(); });
            el.appendChild(div);
        });
        el.classList.add('visible');
        // position, keep within viewport
        const vw = window.innerWidth, vh = window.innerHeight;
        let x = e.clientX, y = e.clientY;
        el.style.left = x + 'px'; el.style.top = y + 'px';
        const r = el.getBoundingClientRect();
        if (r.right  > vw) el.style.left = (x - r.width)  + 'px';
        if (r.bottom > vh) el.style.top  = (y - r.height) + 'px';
    }

    return { show, hide };
})();

/* ── MINI PROMPT ────────────────────────────────────────────────
   Lightweight inline prompt to avoid ugly browser prompt()       */
function miniPrompt(fields, prefill, opts) {
    const deletable = opts && opts.deletable;
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6)`;
        const box = document.createElement('div');
        box.style.cssText = `background:var(--panel);border:1px solid var(--border-lt);padding:20px;display:flex;flex-direction:column;gap:10px;min-width:280px;clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 14px) 100%,0 100%)`;
        const inputs = {};
        fields.forEach(({ key, placeholder }) => {
            const inp = document.createElement('input');
            inp.type = 'text'; inp.placeholder = placeholder;
            inp.style.cssText = `background:var(--panel2);border:1px solid var(--border);color:var(--white);font-family:var(--font-pixel);font-size:11px;padding:6px 10px;outline:none;width:100%`;
            if (prefill && prefill[key] !== undefined) inp.value = prefill[key];
            inputs[key] = inp;
            box.appendChild(inp);
        });
        const row = document.createElement('div');
        row.style.cssText = `display:flex;gap:8px;justify-content:flex-end`;
        const finish = (val) => { document.body.removeChild(overlay); resolve(val); };
        if (deletable) {
            const del = document.createElement('button');
            del.textContent = 'delete'; del.className = 'timer-btn';
            del.style.cssText = `margin-right:auto;color:var(--red);border-color:var(--red)`;
            del.addEventListener('click', () => finish('delete'));
            row.appendChild(del);
        }
        const ok = document.createElement('button');
        ok.textContent = deletable ? 'save' : 'ok'; ok.className = 'timer-btn';
        const cancel = document.createElement('button');
        cancel.textContent = 'cancel'; cancel.className = 'timer-btn';
        row.appendChild(cancel); row.appendChild(ok);
        box.appendChild(row); overlay.appendChild(box); document.body.appendChild(overlay);
        const firstInp = Object.values(inputs)[0]; firstInp.focus();
        ok.addEventListener('click', () => {
            const result = {};
            Object.entries(inputs).forEach(([k, v]) => result[k] = v.value.trim());
            finish(result);
        });
        cancel.addEventListener('click', () => finish(null));
        overlay.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') cancel.click(); });
    });
}

/* ── EDIT MODE ──────────────────────────────────────────────── */
const editToggle = document.getElementById('edit-toggle');
editToggle.addEventListener('click', () => {
    document.body.classList.toggle('edit-mode');
});

/* ── SETTINGS ───────────────────────────────────────────────── */
document.getElementById('settings-btn').addEventListener('click', () => {
    if (typeof browser !== 'undefined' && browser.runtime) {
        window.location.href = browser.runtime.getURL('options.html');
    }
});

/* ── BOOKMARKS ─────────────────────────────────────────────────
   Stored under key 'nt_bookmarks'. Seeded from defaults on first load. */
const BM_DEFAULTS = [
    { folder: 'log', links: [
        { label: 'Letterboxd',   url: 'https://letterboxd.com'                    },
        { label: 'MAL',          url: 'https://myanimelist.net'                   },
        { label: 'AniDB',        url: 'https://anidb.net'                         },
        { label: 'Backloggd',    url: 'https://backloggd.com'                     },
        { label: 'RYM',          url: 'https://rateyourmusic.com'                 },
        { label: 'Bookwyrm',     url: 'https://bookwyrm.social'                   },
        { label: 'Trakt',        url: 'https://trakt.tv'                          },
        { label: 'VGMdb',        url: 'https://vgmdb.net'                         },
    ]},
    { folder: 'social', links: [
        { label: 'Lemmy.ml',     url: 'https://lemmy.ml'                          },
        { label: 'Lemmygrad',    url: 'https://lemmygrad.ml'                      },
        { label: 'Reddit',       url: 'https://reddit.com'                        },
    ]},
    { folder: 'learn', links: [
        { label: 'Duolingo',     url: 'https://duolingo.com'                      },
        { label: 'Clozemaster',  url: 'https://clozemaster.com'                   },
        { label: 'Jisho',        url: 'https://jisho.org'                         },
        { label: 'Keybr',        url: 'https://keybr.com'                         },
        { label: 'TypingClub',   url: 'https://www.typingclub.com'                },
        { label: 'Khan Academy', url: 'https://khanacademy.org'                   },
        { label: 'freeCodeCamp', url: 'https://freecodecamp.org'                  },
        { label: 'Seterra',      url: 'https://seterra.com'                       },
        { label: 'Wikipedia',    url: 'https://wikipedia.org'                     },
    ]},
    { folder: 'dev', links: [
        { label: 'GitHub',       url: 'https://github.com'                        },
        { label: 'Neocities',    url: 'https://neocities.org'                     },
        { label: 'WordPress',    url: 'https://wordpress.com'                     },
        { label: 'AlternativeTo',url: 'https://alternativeto.net'                 },
    ]},
    { folder: 'media', links: [
        { label: 'YouTube',      url: 'https://youtube.com'                       },
        { label: 'Serial',       url: 'https://serial.tube'                       },
        { label: 'TheRARBG',     url: 'https://therarbg.to'                       },
        { label: 'Radio Garden', url: 'https://radio.garden'                      },
        { label: 'Itch.io',      url: 'https://itch.io'                           },
        { label: 'Jet Set Radio',url: 'https://jetsetradio.live'                  },
    ]},
    { folder: 'ai', links: [
        { label: 'Claude',       url: 'https://claude.ai'                         },
        { label: 'ChatGPT',      url: 'https://chatgpt.com'                       },
        { label: 'DeepSeek',     url: 'https://chat.deepseek.com'                 },
        { label: 'Qwen',         url: 'https://chat.qwen.ai'                      },
    ]},
    { folder: 'tools', links: [
        { label: 'Raindrop',     url: 'https://app.raindrop.io'                   },
        { label: 'KitchenOwl',   url: 'https://app.kitchenowl.org'                },
        { label: 'Linkwarden',   url: 'https://cloud.linkwarden.app'              },
        { label: 'Flashscore',   url: 'https://flashscore.com'                    },
        { label: 'NationStates', url: 'https://nationstates.net'                  },
        { label: 'TCG Pocket',   url: 'https://tcgpocketcollectiontracker.com'    },
        { label: 'Google Maps',  url: 'https://maps.google.com'                   },
        { label: 'Curi',         url: 'https://curi.ooo'                          },
    ]},
];

/* ── FAVICON AUTO-FETCH ─────────────────────────────────────────
   Uses DuckDuckGo's favicon service — privacy-respecting, no ad tracking. */
function guessFavicon(url) {
    try {
        const { hostname } = new URL(url);
        return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
    } catch { return ''; }
}

/* ── SHARED LINK DIALOG ─────────────────────────────────────────
   Used by both bookmarks and quick access.
   prefill = {label, url, fav} for edit mode, omit for add.
   Resolves {label, url, fav} on save, 'delete' on delete, null on cancel. */
function linkPrompt(prefill) {
    const isEdit = !!prefill;
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65)`;

        const box = document.createElement('div');
        box.style.cssText = `background:var(--panel);border:1px solid var(--border-lt);padding:18px;display:flex;flex-direction:column;gap:10px;min-width:300px;clip-path:polygon(0 0,100% 0,100% calc(100% - 10px),calc(100% - 14px) 100%,0 100%)`;

        const s = (el, css) => { el.style.cssText = css; return el; };
        const inp = (ph) => {
            const i = document.createElement('input');
            i.type = 'text'; i.placeholder = ph;
            s(i, `background:var(--panel2);border:1px solid var(--border);color:var(--white);font-family:var(--font-pixel);font-size:11px;padding:6px 10px;outline:none;width:100%;transition:border-color 0.1s`);
            i.addEventListener('focus', () => i.style.borderColor = 'var(--accent)');
            i.addEventListener('blur',  () => i.style.borderColor = 'var(--border)');
            return i;
        };

        const labelInp = inp('label');
        const urlInp   = inp('https://...');
        const favInp   = inp('favicon url (optional override)');

        if (isEdit) {
            labelInp.value = prefill.label || '';
            urlInp.value   = prefill.url   || '';
            favInp.value   = prefill.fav   || '';
        }

        // preview row
        const previewRow = document.createElement('div');
        s(previewRow, `display:flex;align-items:center;gap:10px;padding:8px;background:var(--panel2);border:1px solid var(--border)`);

        const previewImg = document.createElement('img');
        s(previewImg, `width:24px;height:24px;object-fit:contain;display:none`);

        const previewLetter = document.createElement('div');
        s(previewLetter, `width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:var(--panel);border:1px solid var(--border-lt);color:var(--dim);font-family:var(--font-pixel);font-size:12px;text-transform:uppercase;flex-shrink:0`);
        previewLetter.textContent = '?';

        const previewLabel = document.createElement('span');
        s(previewLabel, `font-family:var(--font-pixel);font-size:11px;color:var(--dimmer);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap`);
        previewLabel.textContent = 'preview';

        const fetchStatus = document.createElement('span');
        s(fetchStatus, `font-family:var(--font-pixel);font-size:9px;color:var(--dimmer);flex-shrink:0`);

        previewRow.appendChild(previewImg);
        previewRow.appendChild(previewLetter);
        previewRow.appendChild(previewLabel);
        previewRow.appendChild(fetchStatus);

        function showFav(src, lbl) {
            previewImg.src = src;
            previewImg.style.display = 'block';
            previewLetter.style.display = 'none';
            previewImg.onerror = () => {
                previewImg.style.display = 'none';
                previewLetter.style.display = 'flex';
                previewLetter.textContent = (lbl || '?')[0];
                fetchStatus.textContent = 'no favicon';
            };
            previewImg.onload = () => { fetchStatus.textContent = ''; };
        }

        function updatePreview() {
            const lbl = labelInp.value.trim();
            previewLabel.textContent = lbl || 'preview';
            previewLetter.textContent = (lbl || '?')[0];

            const override = favInp.value.trim();
            if (override) {
                fetchStatus.textContent = '';
                showFav(override, lbl);
            } else {
                const auto = guessFavicon(urlInp.value.trim());
                if (auto) {
                    fetchStatus.textContent = 'auto';
                    showFav(auto, lbl);
                } else {
                    previewImg.style.display = 'none';
                    previewLetter.style.display = 'flex';
                    fetchStatus.textContent = '';
                }
            }
        }

        // Auto-fetch on URL change
        urlInp.addEventListener('blur', () => {
            const url = urlInp.value.trim();
            if (!url) return;
            // Auto-fill label from domain if empty
            if (!labelInp.value.trim()) {
                try {
                    const host = new URL(url).hostname.replace(/^www\./, '');
                    labelInp.value = host.split('.')[0];
                } catch {}
            }
            updatePreview();
        });
        urlInp.addEventListener('input', updatePreview);
        favInp.addEventListener('input', updatePreview);
        labelInp.addEventListener('input', () => {
            const lbl = labelInp.value.trim();
            previewLabel.textContent = lbl || 'preview';
            previewLetter.textContent = (lbl || '?')[0];
        });

        const btnRow = document.createElement('div');
        s(btnRow, `display:flex;gap:8px;justify-content:flex-end`);

        const finish = (result) => { document.body.removeChild(overlay); resolve(result); };

        if (isEdit) {
            const del = document.createElement('button');
            del.textContent = 'delete'; del.className = 'timer-btn';
            del.style.cssText = `margin-right:auto;color:var(--red);border-color:var(--red)`;
            del.addEventListener('click', () => finish('delete'));
            btnRow.appendChild(del);
        }

        const cancel = document.createElement('button');
        cancel.textContent = 'cancel'; cancel.className = 'timer-btn';
        const ok = document.createElement('button');
        ok.textContent = isEdit ? 'save' : 'add'; ok.className = 'timer-btn';
        btnRow.appendChild(cancel);
        btnRow.appendChild(ok);

        box.appendChild(labelInp);
        box.appendChild(urlInp);
        box.appendChild(favInp);
        box.appendChild(previewRow);
        box.appendChild(btnRow);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        labelInp.focus();

        if (isEdit) updatePreview();

        ok.addEventListener('click', () => {
            const label = labelInp.value.trim();
            const url   = urlInp.value.trim();
            if (!label || !url) return;
            // Save override if provided, otherwise save the auto-fetched URL
            const fav = favInp.value.trim() || guessFavicon(url);
            finish({ label, url, fav });
        });
        cancel.addEventListener('click', () => finish(null));
        overlay.addEventListener('keydown', e => {
            if (e.key === 'Enter') ok.click();
            if (e.key === 'Escape') cancel.click();
        });
    });
}

// Keep bookmarkAddPrompt as alias for callers that use it
const bookmarkAddPrompt = linkPrompt;

async function loadBookmarks() {
    let data = await Store.get('nt_bookmarks');
    if (!data) { data = BM_DEFAULTS; await Store.set('nt_bookmarks', data); }
    const list = document.getElementById('folder-list');

    // Remember which folders are open before wiping
    const openFolders = new Set();
    list.querySelectorAll('details.folder').forEach((el, i) => {
        if (el.open) openFolders.add(i);
    });

    list.innerHTML = '';

    data.forEach((folder, fi) => {
        const details = document.createElement('details');
        details.className = 'folder';
        details.draggable = true;
        details.dataset.dragIndex = fi;

        const summary = document.createElement('summary');
        summary.className = 'folder-head';
        const icon = document.createElement('span');
        icon.className = 'folder-icon';
        icon.textContent = '◈';
        summary.appendChild(icon);
        summary.appendChild(document.createTextNode(' ' + folder.folder));

        // folder summary bar buttons (edit mode only)
        const headBtns = document.createElement('span');
        headBtns.className = 'folder-head-btns';

        const addLinkBtn = document.createElement('button');
        addLinkBtn.className = 'folder-head-btn';
        addLinkBtn.innerHTML = '<i class="ph-light ph-plus"></i>';
        addLinkBtn.title = 'add link';
        addLinkBtn.addEventListener('click', async e => {
            e.preventDefault(); e.stopPropagation();
            const r = await bookmarkAddPrompt();
            if (!r || r === 'delete') return;
            const d = await Store.get('nt_bookmarks') || BM_DEFAULTS;
            d[fi].links.push({ label: r.label, url: r.url, fav: r.fav });
            await Store.set('nt_bookmarks', d);
            loadBookmarks();
        });

        const editFolderBtn = document.createElement('button');
        editFolderBtn.className = 'folder-head-btn';
        editFolderBtn.innerHTML = '<i class="ph-light ph-pencil-simple"></i>';
        editFolderBtn.title = 'edit folder';
        editFolderBtn.addEventListener('click', async e => {
            e.preventDefault(); e.stopPropagation();
            const d = await Store.get('nt_bookmarks') || BM_DEFAULTS;
            const r = await miniPrompt(
                [{ key: 'name', placeholder: 'folder name' }],
                { name: d[fi].folder },
                { deletable: true }
            );
            if (!r) return;
            if (r === 'delete') {
                d.splice(fi, 1);
            } else if (r.name) {
                d[fi].folder = r.name;
            }
            await Store.set('nt_bookmarks', d);
            loadBookmarks();
        });

        headBtns.appendChild(editFolderBtn);
        headBtns.appendChild(addLinkBtn);
        summary.appendChild(headBtns);
        details.appendChild(summary);

        const linksDiv = document.createElement('div');
        linksDiv.className = 'folder-links grid';

        folder.links.forEach((link, li) => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.className = 'fav-tile';
            a.draggable = true;
            a.dataset.dragIndex = li;

            const img = document.createElement('img');
            img.className = 'fav';
            img.src = link.fav || guessFavicon(link.url);
            img.alt = '';
            img.addEventListener('error', () => {
                const letter = document.createElement('div');
                letter.className = 'fav-letter';
                letter.textContent = (link.label || '?')[0];
                img.replaceWith(letter);
            });

            const label = document.createElement('span');
            label.textContent = link.label;

            const edit = document.createElement('button');
            edit.className = 'tile-edit';
            edit.innerHTML = '<i class="ph-light ph-pencil-simple"></i>';
            edit.title = 'edit';
            edit.addEventListener('click', async e => {
                e.preventDefault();
                e.stopImmediatePropagation();
                const d = await Store.get('nt_bookmarks') || BM_DEFAULTS;
                const current = d[fi].links[li];
                const r = await bookmarkAddPrompt({ label: current.label, url: current.url, fav: current.fav });
                if (!r) return;
                if (r === 'delete') {
                    d[fi].links.splice(li, 1);
                } else {
                    d[fi].links[li] = { label: r.label, url: r.url, fav: r.fav };
                }
                await Store.set('nt_bookmarks', d);
                loadBookmarks();
            });
            edit.addEventListener('mousedown', e => e.stopImmediatePropagation());
            edit.addEventListener('mouseup',   e => e.stopImmediatePropagation());

            a.appendChild(img);
            a.appendChild(label);
            a.appendChild(edit);
            linksDiv.appendChild(a);
        });

        details.appendChild(linksDiv);
        enableDragSort(
            linksDiv,
            'a[data-drag-index]',
            async () => { const d = (await Store.get('nt_bookmarks')) || BM_DEFAULTS; return d[fi].links; },
            async arr => { const d = (await Store.get('nt_bookmarks')) || BM_DEFAULTS; d[fi].links = arr; await Store.set('nt_bookmarks', d); },
            loadBookmarks
        );
        if (openFolders.has(fi)) details.open = true;
        list.appendChild(details);
    });
}

loadBookmarks();
enableDragSort(
    document.getElementById('folder-list'),
    'details[data-drag-index]',
    async () => (await Store.get('nt_bookmarks')) || BM_DEFAULTS,
    async arr => Store.set('nt_bookmarks', arr),
    loadBookmarks
);

document.getElementById('bm-add-folder-btn').addEventListener('click', async () => {
    const r = await miniPrompt([{ key: 'name', placeholder: 'folder name' }]);
    if (!r || !r.name) return;
    const d = (await Store.get('nt_bookmarks')) || BM_DEFAULTS;
    d.push({ folder: r.name, links: [] });
    await Store.set('nt_bookmarks', d);
    loadBookmarks();
});

/* ── RECENTLY VISITED ───────────────────────────────────────────*/
async function loadRecent() {
    const grid = document.getElementById('recent-grid');
    const items = (await Store.get('nt_recent')) || [];
    grid.innerHTML = '';

    items.forEach((item, i) => {
        const tile = document.createElement('div');
        tile.className = 'recent-tile';
        const rtName = document.createElement('div');
        rtName.className = 'rt-name';
        rtName.textContent = item.name;
        const rtUrl = document.createElement('div');
        rtUrl.className = 'rt-url';
        rtUrl.textContent = item.url;
        tile.appendChild(rtName);
        tile.appendChild(rtUrl);
        tile.addEventListener('click', () => window.open(item.url, '_blank'));

        const x = document.createElement('button');
        x.className = 'recent-x';
        x.innerHTML = '<i class="ph-light ph-x"></i>';
        x.addEventListener('click', async e => {
            e.stopPropagation();
            const arr = (await Store.get('nt_recent')) || [];
            arr.splice(i, 1);
            await Store.set('nt_recent', arr);
            loadRecent();
        });
        tile.appendChild(x);
        grid.appendChild(tile);
    });
}

// Quick-add form — always visible, no edit mode needed
async function quickAddRecent() {
    const name = document.getElementById('rqa-name').value.trim();
    const url  = document.getElementById('rqa-url').value.trim();
    if (!name || !url) return;
    const arr = (await Store.get('nt_recent')) || [];
    arr.unshift({ name, url });
    if (arr.length > 8) arr.pop();
    await Store.set('nt_recent', arr);
    document.getElementById('rqa-name').value = '';
    document.getElementById('rqa-url').value  = '';
    loadRecent();
}

document.getElementById('rqa-btn').addEventListener('click', quickAddRecent);
document.getElementById('rqa-url').addEventListener('keydown', e => { if (e.key === 'Enter') quickAddRecent(); });

loadRecent();

/* ── QUICK ACCESS ───────────────────────────────────────────────
   Default links seeded on first load, then editable via storage  */
const QA_DEFAULTS = [
    { label: 'Raindrop',  url: 'https://app.raindrop.io'   },
    { label: 'DeepL',     url: 'https://deepl.com'         },
    { label: 'Habitica',  url: 'https://habitica.com'      },
    { label: 'Notesnook', url: 'https://app.notesnook.com' },
];

async function loadQuickAccess() {
    let items = await Store.get('nt_quick');
    if (!items) { items = QA_DEFAULTS; await Store.set('nt_quick', items); }
    const container = document.querySelector('.quick-links');
    container.innerHTML = '';

    items.forEach((item, i) => {
        const a = document.createElement('a');
        a.href = item.url; a.target = '_blank';
        a.draggable = true;
        a.dataset.dragIndex = i;
        const favImg = document.createElement('img');
        favImg.className = 'ql-fav';
        favImg.src = item.favicon || item.fav || guessFavicon(item.url);
        favImg.alt = '';
        a.appendChild(favImg);
        a.appendChild(document.createTextNode(' ' + item.label));

        const btnGroup = document.createElement('span');
        btnGroup.style.cssText = 'margin-left:auto;display:none;align-items:center;gap:0;flex-shrink:0;';
        btnGroup.className = 'qa-btn-group';

        const edit = document.createElement('button');
        edit.className = 'qa-edit';
        edit.innerHTML = '<i class="ph-light ph-pencil-simple"></i>';
        edit.title = 'edit';
        edit.addEventListener('click', async e => {
            e.preventDefault(); e.stopPropagation();
            const arr = (await Store.get('nt_quick')) || QA_DEFAULTS;
            const current = arr[i];
            const r = await linkPrompt({ label: current.label, url: current.url, fav: current.favicon });
            if (!r) return;
            if (r === 'delete') {
                arr.splice(i, 1);
            } else if (r.label && r.url) {
                arr[i] = { label: r.label, url: r.url, favicon: r.fav || '' };
            }
            await Store.set('nt_quick', arr);
            loadQuickAccess();
        });

        btnGroup.appendChild(edit);
        a.appendChild(btnGroup);
        container.appendChild(a);
    });
}

loadQuickAccess();
enableDragSort(
    document.querySelector('.quick-links'),
    'a[data-drag-index]',
    async () => (await Store.get('nt_quick')) || QA_DEFAULTS,
    async arr => Store.set('nt_quick', arr),
    loadQuickAccess
);

document.getElementById('qa-add-btn').addEventListener('click', async () => {
    const r = await linkPrompt();
    if (!r || !r.label || !r.url) return;
    const arr = (await Store.get('nt_quick')) || QA_DEFAULTS;
    arr.push({ label: r.label, url: r.url, favicon: r.fav || '' });
    await Store.set('nt_quick', arr);
    loadQuickAccess();
});

/* ── QUOTES ─────────────────────────────────────────────────── */
const QUOTES = [
    { text: 'The tradition of all dead generations weighs like a nightmare on the brains of the living.', author: 'Marx' },
    { text: 'Everything that exists deserves to perish.', author: 'Hegel' },
    { text: 'History does nothing; it possesses no immense wealth, it wages no battles. It is man, real, living man who does all that.', author: 'Marx & Engels' },
    { text: 'The philosophers have only interpreted the world. The point, however, is to change it.', author: 'Marx' },
    { text: 'There is no document of civilization that is not at the same time a document of barbarism.', author: 'Benjamin' },
    { text: 'To live is to war with trolls in heart and soul. To write is to sit in judgment on oneself.', author: 'Ibsen' },
    { text: 'The most courageous act is still to think for yourself. Aloud.', author: 'Chanel' },
    { text: 'Freedom is not something that anybody can be given. Freedom is something people take.', author: 'Baldwin' },
    { text: 'One does not discover new lands without consenting to lose sight of the shore.', author: 'Gide' },
    { text: 'A map of the world that does not include Utopia is not worth even glancing at.', author: 'Wilde' },
];

const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
document.getElementById('quote-text').textContent   = q.text;
document.getElementById('quote-author').textContent = q.author;

let quoteIndex = QUOTES.indexOf(q);
document.getElementById('quote-next').addEventListener('click', () => {
    let idx;
    do { idx = Math.floor(Math.random() * QUOTES.length); } while (idx === quoteIndex);
    quoteIndex = idx;
    document.getElementById('quote-text').textContent   = QUOTES[idx].text;
    document.getElementById('quote-author').textContent = QUOTES[idx].author;
});

/* ── KANJI WORD OF THE DAY ──────────────────────────────────── */
const WORDS = [
    // N5
    { k:'水', r:'みず',       l:'n5', m:'water' },
    { k:'火', r:'ひ',         l:'n5', m:'fire' },
    { k:'山', r:'やま',       l:'n5', m:'mountain' },
    { k:'川', r:'かわ',       l:'n5', m:'river' },
    { k:'空', r:'そら',       l:'n5', m:'sky' },
    { k:'花', r:'はな',       l:'n5', m:'flower' },
    { k:'木', r:'き',         l:'n5', m:'tree, wood' },
    { k:'石', r:'いし',       l:'n5', m:'stone, rock' },
    { k:'道', r:'みち',       l:'n5', m:'road, path' },
    { k:'手', r:'て',         l:'n5', m:'hand' },
    { k:'目', r:'め',         l:'n5', m:'eye' },
    { k:'口', r:'くち',       l:'n5', m:'mouth' },
    { k:'耳', r:'みみ',       l:'n5', m:'ear' },
    { k:'足', r:'あし',       l:'n5', m:'foot, leg' },
    { k:'心', r:'こころ',     l:'n5', m:'heart, mind' },
    { k:'雨', r:'あめ',       l:'n5', m:'rain' },
    { k:'風', r:'かぜ',       l:'n5', m:'wind' },
    { k:'月', r:'つき',       l:'n5', m:'moon, month' },
    { k:'日', r:'ひ',         l:'n5', m:'sun, day' },
    { k:'年', r:'とし',       l:'n5', m:'year' },
    // N4
    { k:'橋', r:'はし',       l:'n4', m:'bridge' },
    { k:'庭', r:'にわ',       l:'n4', m:'garden' },
    { k:'池', r:'いけ',       l:'n4', m:'pond' },
    { k:'窓', r:'まど',       l:'n4', m:'window' },
    { k:'声', r:'こえ',       l:'n4', m:'voice' },
    { k:'夢', r:'ゆめ',       l:'n4', m:'dream' },
    { k:'光', r:'ひかり',     l:'n4', m:'light' },
    { k:'影', r:'かげ',       l:'n4', m:'shadow' },
    { k:'森', r:'もり',       l:'n4', m:'forest' },
    { k:'海', r:'うみ',       l:'n4', m:'sea, ocean' },
    { k:'星', r:'ほし',       l:'n4', m:'star' },
    { k:'雪', r:'ゆき',       l:'n4', m:'snow' },
    { k:'波', r:'なみ',       l:'n4', m:'wave' },
    { k:'鳥', r:'とり',       l:'n4', m:'bird' },
    { k:'葉', r:'は',         l:'n4', m:'leaf' },
    { k:'根', r:'ね',         l:'n4', m:'root' },
    { k:'岩', r:'いわ',       l:'n4', m:'rock, boulder' },
    { k:'砂', r:'すな',       l:'n4', m:'sand' },
    // N3
    { k:'霧', r:'きり',       l:'n3', m:'fog, mist' },
    { k:'崖', r:'がけ',       l:'n3', m:'cliff' },
    { k:'滝', r:'たき',       l:'n3', m:'waterfall' },
    { k:'峰', r:'みね',       l:'n3', m:'peak, summit' },
    { k:'縁', r:'えん',       l:'n3', m:'fate, connection' },
    { k:'鏡', r:'かがみ',     l:'n3', m:'mirror' },
    { k:'扉', r:'とびら',     l:'n3', m:'door, gate' },
    { k:'涙', r:'なみだ',     l:'n3', m:'tear, teardrop' },
    { k:'傷', r:'きず',       l:'n3', m:'wound, scar' },
    { k:'嘘', r:'うそ',       l:'n3', m:'lie, falsehood' },
    { k:'誓', r:'ちかい',     l:'n3', m:'oath, vow' },
    { k:'憎', r:'にくしみ',   l:'n3', m:'hatred' },
    { k:'怒', r:'いかり',     l:'n3', m:'anger, rage' },
    { k:'罪', r:'つみ',       l:'n3', m:'crime, sin, guilt' },
    { k:'罰', r:'ばつ',       l:'n3', m:'punishment' },
    { k:'闇', r:'やみ',       l:'n3', m:'darkness' },
    // N2
    { k:'儚', r:'はかない',   l:'n2', m:'fleeting, ephemeral' },
    { k:'憐', r:'あわれ',     l:'n2', m:'pity, compassion' },
    { k:'憧', r:'あこがれ',   l:'n2', m:'longing, yearning' },
    { k:'諦', r:'あきらめ',   l:'n2', m:'resignation, giving up' },
    { k:'葛', r:'かつら',     l:'n2', m:'arrowroot; conflict' },
    { k:'懐', r:'なつかしい', l:'n2', m:'nostalgic, dear' },
    { k:'煩', r:'わずらわしい',l:'n2',m:'troublesome, vexing' },
    { k:'濁', r:'にごり',     l:'n2', m:'muddiness, impurity' },
    { k:'彷', r:'さまよい',   l:'n2', m:'wandering' },
    // N1
    { k:'刹那', r:'せつな',   l:'n1', m:'moment, instant' },
    { k:'無常', r:'むじょう', l:'n1', m:'impermanence' },
    { k:'幽玄', r:'ゆうげん', l:'n1', m:'subtle grace, mystery' },
    { k:'侘寂', r:'わびさび', l:'n1', m:'beauty in imperfection' },
    { k:'物哀', r:'もののあわれ',l:'n1',m:'pathos of things' },
    { k:'諦観', r:'ていかん', l:'n1', m:'resignation, detachment' },
    { k:'執着', r:'しゅうちゃく',l:'n1',m:'attachment, obsession' },
    { k:'業', r:'ごう',       l:'n1', m:'karma, fate' },
    { k:'虚無', r:'きょむ',   l:'n1', m:'nihilism, void' },
    { k:'断絶', r:'だんぜつ', l:'n1', m:'severance, rupture' },
];

function renderWord(w) {
    const el = document.getElementById('kanji-char');
    el.innerHTML = '';
    const a = document.createElement('a');
    a.href = 'https://jisho.org/search/' + encodeURIComponent(w.k) + '%20%23kanji';
    a.target = '_blank';
    a.style.cssText = 'color:inherit;text-decoration:none;';
    a.textContent = w.k;
    el.appendChild(a);
    document.getElementById('kanji-reading').textContent = w.r;
    document.getElementById('kanji-meaning').textContent = w.m;
    const lvlEl = document.getElementById('kanji-level');
    lvlEl.textContent = w.l.toUpperCase();
    lvlEl.className   = 'kanji-level ' + w.l;
}

// Pick a random word from a pool, avoiding immediate repeat
let wordIndex = 0; // declared first so randomWordFrom can reference it

function randomWordFrom(pool) {
    if (pool.length === 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (idx === wordIndex);
    return idx;
}

wordIndex = randomWordFrom(WORDS);
renderWord(WORDS[wordIndex]);

document.getElementById('kanji-next').addEventListener('click', () => {
    wordIndex = randomWordFrom(WORDS);
    renderWord(WORDS[wordIndex]);
});

/* ── THEME TOGGLE ───────────────────────────────────────────── */
const toggleBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('nt_theme') || 'dark';
if (savedTheme === 'light') document.body.classList.add('light');
toggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('nt_theme', isLight ? 'light' : 'dark');
});

/* ── FOCUS SEARCH ON KEYPRESS ───────────────────────────────── */
document.addEventListener('keydown', e => {
    const el = document.getElementById('search-input');
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        el.focus();
    }
});
/* ── PROFILE TAGLINE ─────────────────────────────────────────── */
(function() {
    const TAGLINES = [
        '過去を殺せ',
        'ほしのこえ',
        '星の大海',
        '攻殻機動隊',
        '銀河鉄道の夜',
    ];
    const el = document.getElementById('profile-tagline');
    if (el) el.textContent = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
})();

/* ── SETTINGS WIRING ─────────────────────────────────────────── */
/* Reads all nt_* keys from storage on load and applies them.     */
(async function applySettings() {

    /* ── helpers ── */
    function fetchTemp(lat, lon) {
        const el = document.getElementById('temperature');
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
            .then(r => r.json())
            .then(d => { el.textContent = `${d.current_weather.temperature}°C`; })
            .catch(() => { el.textContent = 'n/a'; });
    }

    /* ── 1. BACKGROUND IMAGE ── */
    const bgImages = await Store.get('nt_bg_images');
    if (bgImages && bgImages.length > 0) {
        const pick  = bgImages[Math.floor(Math.random() * bgImages.length)];
        const bgEl  = document.getElementById('bg');
        if (bgEl) {
            const bgBlur = await Store.get('nt_bg_blur');
            const img = document.createElement('img');
            img.src = pick.dataUrl;
            img.alt = '';
            bgEl.innerHTML = '';
            bgEl.appendChild(img);
            bgEl.classList.toggle('blurred', bgBlur !== false);
        }
    }

    /* ── 2. PROFILE IMAGES ── */
    const profImages = await Store.get('nt_profile_images');
    const wrap = document.getElementById('profile-img-wrap');
    if (wrap) {
        wrap.innerHTML = '';
        if (profImages && profImages.length > 0) {
            const activeIdx = Math.floor(Math.random() * profImages.length);
            profImages.forEach((img, i) => {
                const el = document.createElement('img');
                el.id  = `prof-img-${i}`;
                el.src = img.dataUrl;
                el.alt = '';
                if (i === activeIdx) el.classList.add('active');
                wrap.appendChild(el);
            });
        }
        // if no images, wrap stays empty — no broken images shown
    }

    /* ── 3. LANGUAGE + USERNAME ── */
    const uiLang    = await Store.get('nt_ui_lang')    || 'en';
    const titleLang = await Store.get('nt_title_lang') || 'ja';
    const username  = await Store.get('nt_username');

    // Store uiLang globally so tick() can use it for greetings
    window._uiLang = uiLang;

    // Username with lang-aware fallback
    const usernameEl = document.getElementById('username');
    if (usernameEl) {
        usernameEl.textContent = username || t(titleLang).username_fallback;
    }

    // Widget titles
    // Widget titles — from i18n.js tw()
    const titles = tw(titleLang);
    document.querySelectorAll('.wt-label[data-widget-label]').forEach(label => {
        const key = label.dataset.widgetLabel;
        if (titles[key]) label.textContent = titles[key];
    });

    // UI strings — from i18n.js t()
    const ui = t(uiLang);
    const searchEl = document.getElementById('search-input');
    if (searchEl) searchEl.placeholder = ui.search_placeholder;
    const notesEl = document.getElementById('notes-area');
    if (notesEl) notesEl.placeholder = ui.notes_placeholder;

    // Refresh greeting immediately with correct lang
    const nowH = new Date().getHours();
    greetingSet = getGreetingStrings(nowH, window._uiLang);
    const greetEl = document.getElementById('greeting');
    if (greetEl) setGreeting(greetEl, greetingSet[Math.floor(Math.random() * greetingSet.length)]);

    /* ── 4. LOCATION / TEMPERATURE ── */
    const location = await Store.get('nt_location');
    if (location && location.lat && location.lon) {
        fetchTemp(location.lat, location.lon);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchTemp(pos.coords.latitude, pos.coords.longitude),
            ()  => { const el = document.getElementById('temperature'); if (el) el.textContent = 'n/a'; }
        );
    } else {
        const el = document.getElementById('temperature');
        if (el) el.textContent = 'n/a';
    }

    /* ── 5. FONTS ── */
    const FONT_MAP_LATIN = {
        'inter':           "'Inter', sans-serif",
        'share-tech-mono': "'Share Tech Mono', monospace",
        'vt323':           "'VT323', monospace",
        'courier-prime':   "'Courier Prime', monospace",
    };
    const FONT_MAP_JP = {
        'dotgothic16':   "'DotGothic16', monospace",
        'biz-udgothic':  "'BIZ UDGothic', sans-serif",
        'noto-sans-jp':  "'Noto Sans JP', sans-serif",
    };
    const FONT_MAP_CLOCK = {
        'medodica': "'Medodica', monospace",
        'orbitron': "'Orbitron', monospace",
        'oxanium':  "'Oxanium', monospace",
    };

    const fontLatin = await Store.get('nt_font_latin');
    const fontJp    = await Store.get('nt_font_jp');
    const fontClock = await Store.get('nt_font_clock');

    if (fontLatin && FONT_MAP_LATIN[fontLatin]) {
        document.documentElement.style.setProperty('--font-pixel',
            `${FONT_MAP_LATIN[fontLatin]}, ${FONT_MAP_JP[fontJp] || "'DotGothic16', monospace"}`);
    } else if (fontJp && FONT_MAP_JP[fontJp]) {
        document.documentElement.style.setProperty('--font-pixel',
            `'DotGothic16', ${FONT_MAP_JP[fontJp]}`);
    }
    if (fontClock && FONT_MAP_CLOCK[fontClock]) {
        document.documentElement.style.setProperty('--font-doto', FONT_MAP_CLOCK[fontClock]);
        // Apply per-font size class to body so both #clock and .timer-input/.timer-sep scale correctly
        document.body.classList.remove('font-medodica', 'font-orbitron', 'font-oxanium');
        document.body.classList.add(`font-${fontClock}`);
    }

    /* ── 6. CLOCK FORMAT & SECONDS ── */
    const clockFormat  = await Store.get('nt_clock_format');   // '24h' | '12h'
    const clockSeconds = await Store.get('nt_clock_seconds');  // true | false
    const clockTheme   = await Store.get('nt_clock_theme');    // 'theme' | 'light' | 'dark'

    // Clear the original tick interval, replace with settings-aware one
    clearInterval(window._tickInterval);
    window._clockFormat  = clockFormat  || '24h';
    window._clockSeconds = clockSeconds !== false;

    // Re-wire tick to respect settings
    function tickWithSettings() {
        const now  = new Date();
        const rawH = now.getHours();
        const m    = now.getMinutes();
        const s    = now.getSeconds();

        if (binaryClock) {
            // Binary always 24h; pass null for s when hiding seconds
            renderBinary(rawH, m, window._clockSeconds ? s : null);
        } else {
            let h = rawH;
            let suffix = '';
            if (window._clockFormat === '12h') {
                suffix = h >= 12 ? ' PM' : ' AM';
                h = h % 12 || 12;
            }
            document.getElementById('clock').textContent = window._clockSeconds
                ? `${pad(h)}:${pad(m)}:${pad(s)}${suffix}`
                : `${pad(h)}:${pad(m)}${suffix}`;
        }

        if (rawH !== lastHour) {
            lastHour = rawH;
            greetingSet = getGreetingStrings(rawH, window._uiLang || 'en');
            setGreeting(document.getElementById('greeting'),
                greetingSet[Math.floor(Math.random() * greetingSet.length)]);
            document.getElementById('date').textContent =
                `${DAYS[now.getDay()].toUpperCase()} · ${MONTHS[now.getMonth()].toUpperCase()} ${now.getDate()} · ${now.getFullYear()}`;
            document.getElementById('day-name').textContent = DAYS[now.getDay()];
            document.getElementById('week-num').textContent = `W${pad(getWeekNum(now))}`;
            document.getElementById('year-progress').textContent = getYearProgress(now);
        }
    }
    window._tickInterval = setInterval(tickWithSettings, 1000);
    tickWithSettings();

    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.classList.remove('force-light', 'force-dark');
        if (clockTheme === 'light') clockEl.classList.add('force-light');
        else if (clockTheme === 'dark') clockEl.classList.add('force-dark');
        // 'theme' — no class, color follows --white which tracks the page theme
    }

    /* ── 7. SEARCH ENGINES + TARGET ── */
    const engines      = await Store.get('nt_engines');
    const searchTarget = await Store.get('nt_search_target') || '_blank';

    if (engines && engines.length > 0) {
        const bar = document.querySelector('.engine-bar') || document.querySelector('.search-engines');
        if (bar) {
            bar.innerHTML = '';
            engines.forEach(eng => {
                const btn = document.createElement('button');
                btn.className = 'engine-btn' + (eng.isDefault ? ' active' : '');
                btn.dataset.url = eng.url;
                btn.textContent = eng.name;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.engine-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeEngine = btn;
                });
                bar.appendChild(btn);
            });
            // reset activeEngine to the new default
            activeEngine = bar.querySelector('.engine-btn.active') || bar.querySelector('.engine-btn');
        }
    }

    // Patch search to respect target
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // Remove old listener by cloning; re-add with correct target
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        newInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const q = e.target.value.trim();
                if (!q) return;
                const url = (activeEngine?.dataset?.url || 'https://duckduckgo.com/?q=') + encodeURIComponent(q);
                window.open(url, searchTarget);
                e.target.value = '';
            }
        });
    }

    /* ── 8. JLPT FILTER on word widget ── */
    const jlptLevel = await Store.get('nt_jlpt_level') || 'all';
    if (jlptLevel !== 'all') {
        const filtered = WORDS.filter(w => w.l === jlptLevel);
        if (filtered.length > 0) {
            wordIndex = Math.floor(Math.random() * filtered.length);
            renderWord(filtered[wordIndex]);
            const nextBtn = document.getElementById('kanji-next');
            if (nextBtn) {
                const newBtn = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(newBtn, nextBtn);
                newBtn.addEventListener('click', () => {
                    let idx;
                    do { idx = Math.floor(Math.random() * filtered.length); } while (idx === wordIndex && filtered.length > 1);
                    wordIndex = idx;
                    renderWord(filtered[wordIndex]);
                });
            }
        }
    }

    /* ── 9. CUSTOM QUOTES ── */
    const customQuotes = await Store.get('nt_custom_quotes');
    if (customQuotes && customQuotes.length > 0) {
        const q = customQuotes[Math.floor(Math.random() * customQuotes.length)];
        const textEl   = document.getElementById('quote-text');
        const authorEl = document.getElementById('quote-author');
        if (textEl)   textEl.textContent   = q.text;
        if (authorEl) authorEl.textContent = q.author;
    }

    /* ── 10. WIDGET LAYOUT (col, order, visibility) ── */
    const layout = await Store.get('nt_widget_layout');
    if (layout && layout.length > 0) {
        const cols = {
            left:   document.getElementById('col-left'),
            center: document.getElementById('col-center'),
            right:  document.getElementById('col-right'),
        };

        // Group by column, sorted by order
        const byCol = { left: [], center: [], right: [] };
        layout.forEach(w => {
            const el = document.querySelector(`[data-widget="${w.id}"]`);
            if (!el) return;
            if (w.visible === false) { el.style.display = 'none'; return; }
            el.style.display = '';
            const col = byCol[w.col] || byCol.left;
            col.push({ order: w.order, el });
        });

        // Append widgets to their column in order
        ['left', 'center', 'right'].forEach(colKey => {
            const colEl = cols[colKey];
            if (!colEl) return;
            byCol[colKey]
                .sort((a, b) => a.order - b.order)
                .forEach(({ el }) => colEl.appendChild(el));
        });
    }

})();
