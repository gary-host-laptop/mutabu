/* ══════════════════════════════════════════════════════════════
   data/defaults.js — default data for bookmarks, quick access,
   and profile taglines. Edit these to change the seeded content.
   ══════════════════════════════════════════════════════════════ */

/* ── BOOKMARK DEFAULTS ────────────────────────────────────────── */
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

/* ── QUICK ACCESS DEFAULTS ────────────────────────────────────── */
const QA_DEFAULTS = [
    { label: 'Raindrop',  url: 'https://app.raindrop.io'   },
    { label: 'DeepL',     url: 'https://deepl.com'         },
    { label: 'Habitica',  url: 'https://habitica.com'      },
    { label: 'Notesnook', url: 'https://app.notesnook.com' },
];

/* ── PROFILE TAGLINES ─────────────────────────────────────────── */
const TAGLINES = [
    '過去を殺せ',
    'ほしのこえ',
    '星の大海',
    '攻殻機動隊',
    '銀河鉄道の夜',
]
