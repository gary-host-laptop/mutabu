/* ══════════════════════════════════════════════════════════════
   data/defaults.js — default data for bookmarks, quick access,
   and profile taglines. Edit these to change the seeded content.
   ══════════════════════════════════════════════════════════════ */

/* ── BOOKMARK DEFAULTS ────────────────────────────────────────── */
const BM_DEFAULTS = [
    { folder: 'social', links: [
        { label: 'Lemmy.ml',             url: 'https://lemmy.ml'              },
        { label: 'Reddit',               url: 'https://reddit.com'            },
    ]},
    { folder: 'media', links: [
        { label: 'YouTube',              url: 'https://youtube.com'           },
        { label: 'Serial',               url: 'https://serial.tube'           },
        { label: 'Jet Set Radio Future', url: 'https://jetsetradiofuture.live'},
    ]},
];

/* ── QUICK ACCESS DEFAULTS ────────────────────────────────────── */
const QA_DEFAULTS = [
    { label: 'Karakeep',  url: 'https://cloud.karakeep.app' },
    { label: 'DeepL',     url: 'https://www.deepl.com/en/translator' },
    { label: 'Habitica',  url: 'https://habitica.com'      },
    { label: 'Notesnook', url: 'https://app.notesnook.com' },
];

/* ── QUOTE DEFAULTS ───────────────────────────────────────────── */
const QUOTE_DEFAULTS = [
    { text: 'The tradition of all dead generations weighs like a nightmare on the brains of the living.', author: 'Marx' },
    { text: 'Everything that exists deserves to perish.',                                                  author: 'Hegel' },
];

/* ── PROFILE TAGLINES ─────────────────────────────────────────── */
const TAGLINES = [
    '過去を殺せ',
    'ほしのこえ',
    '星の大海',
    '攻殻機動隊',
    '銀河鉄道の夜',
]
