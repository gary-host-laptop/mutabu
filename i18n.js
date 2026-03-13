/* ══════════════════════════════════════════════════════════════
   i18n.js — translation strings for 無タブ
   ──────────────────────────────────────────────────────────────
   Structure per locale:
     name     — display name shown in language selectors
     ui       — strings used in the main newtab UI
     widgets  — widget title labels (controlled by title lang setting)

   To add a new language:
     1. Add a new key block below following the same structure
     2. Add an <option value="xx"> to #ui-lang-select in options.html
     3. Add a toggle button entry for title lang if desired
   ══════════════════════════════════════════════════════════════ */

const I18N = {

    en: {
        name: 'English',

        ui: {
            search_placeholder: 'search...',

            greeting_night:     ['late night', 'still up?', 'past midnight'],
            greeting_morning:   ['good morning', 'still sleepy?', 'rise and shine'],
            greeting_afternoon: ['good afternoon', 'afternoon', 'hey there'],
            greeting_evening:   ['good evening', 'evening', 'night shift'],

            notes_placeholder:  'notes...',
            notes_clear:        'clear',

            timer_start:        'start',
            timer_pause:        'pause',
            timer_reset:        'reset',

            rain_play:          '▶ play',
            rain_stop:          '■ stop',

            kanji_next:         'next ›',

            username_fallback:  'user',
        },

        widgets: {
            'quick-access':     'quick access',
            'timer':            'timer',
            'rain':             'rain sounds',
            'quote':            'quotes',
            'bookmarks':        'bookmarks',
            'notes':            'notes',
            'recently-visited': 'visit later',
            'profile':          'profile',
            'status':           'status',
            'kotoba':           'words',
        },
    },

    ja: {
        name: '日本語',

        ui: {
            search_placeholder: '検索...',

            greeting_night:     ['夜中に', '夜に', '真夜中に'],
            greeting_morning:   ['おはよう', 'まだ眠い?', '朝に'],
            greeting_afternoon: ['こんにちは', '午後に', 'お疲れ様'],
            greeting_evening:   ['こんばんは', '夜に', '夕方に'],

            notes_placeholder:  'メモ...',
            notes_clear:        'クリア',

            timer_start:        'スタート',
            timer_pause:        '一時停止',
            timer_reset:        'リセット',

            rain_play:          '▶ 再生',
            rain_stop:          '■ 停止',

            kanji_next:         '次 ›',

            username_fallback:  'ユーザー',
        },

        widgets: {
            'quick-access':     'クイックアクセス',
            'timer':            'タイマー',
            'rain':             '雨音',
            'quote':            '名言',
            'bookmarks':        'ブックマーク',
            'notes':            'メモ帳',
            'recently-visited': '後で見る',
            'profile':          'プロフィール',
            'status':           '状態',
            'kotoba':           '言葉',
        },
    },

};

/* ── HELPERS ─────────────────────────────────────────────────── */

/**
 * Get the UI strings for a given language code.
 * Falls back to English if the code is unknown.
 */
function t(lang) {
    return (I18N[lang] || I18N.en).ui;
}

/**
 * Get the widget title strings for a given language code.
 * Falls back to English if the code is unknown.
 */
function tw(lang) {
    return (I18N[lang] || I18N.en).widgets;
}

/**
 * Get greeting array for a given hour and language.
 */
function getGreetingStrings(h, lang) {
    const ui = t(lang);
    if (h >= 0  && h < 6)  return ui.greeting_night;
    if (h >= 6  && h < 12) return ui.greeting_morning;
    if (h >= 12 && h < 18) return ui.greeting_afternoon;
    return ui.greeting_evening;
}
