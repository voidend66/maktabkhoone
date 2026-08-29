// High quality, self-contained SVG Data URI book covers and avatars
// Guaranteed to load instantly 100% offline, on any local server, intranet, or filtered network without external CDN dependencies.

export const createSvgCover = (
  title: string,
  category: string,
  gradientStart: string,
  gradientEnd: string,
  accentColor: string,
  iconSymbol: string,
  patternType: 'stars' | 'bubbles' | 'sports' | 'nature' | 'sparkles' | 'stripes' = 'stars'
): string => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="${gradientEnd}"/>
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="560" rx="16" fill="url(#bg)"/>

  <!-- Playful Background Patterns & Floating Shapes for Children -->
  <g opacity="0.18">
    <circle cx="60" cy="80" r="40" fill="#ffffff"/>
    <circle cx="340" cy="120" r="60" fill="#ffffff"/>
    <circle cx="80" cy="460" r="50" fill="#ffffff"/>
    <circle cx="330" cy="450" r="45" fill="#ffffff"/>
    <polygon points="190,40 196,54 212,56 200,66 204,82 190,74 176,82 180,66 168,56 184,54" fill="#fef08a"/>
    <polygon points="70,250 74,260 86,262 77,270 80,282 70,276 60,282 63,270 54,262 66,260" fill="#fef08a"/>
    <polygon points="330,280 334,290 346,292 337,300 340,312 330,306 320,312 323,300 314,292 326,290" fill="#fef08a"/>
  </g>

  <!-- Cheerful Border Frame -->
  <rect x="20" y="20" width="360" height="520" rx="14" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-opacity="0.4"/>
  <rect x="28" y="28" width="344" height="504" rx="10" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="8,6" stroke-opacity="0.8"/>

  <!-- Top Cheerful School Library Header Badge -->
  <g transform="translate(200, 60)">
    <rect x="-110" y="-14" width="220" height="28" rx="14" fill="#ffffff" fill-opacity="0.95" filter="url(#shadow)"/>
    <text y="5" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="12" font-weight="900" fill="#0f172a">
      ✨ کتابخانه مدرسه مکتب‌خانه ✨
    </text>
  </g>

  <!-- Large Fun Central Icon Bubble -->
  <g transform="translate(200, 185)">
    <circle r="68" fill="url(#glow)" filter="url(#shadow)"/>
    <circle r="60" fill="#ffffff" fill-opacity="0.95" stroke="${accentColor}" stroke-width="4"/>
    <circle r="52" fill="${accentColor}" fill-opacity="0.15"/>
    <text y="18" text-anchor="middle" font-size="52">${iconSymbol}</text>
  </g>

  <!-- Category Tag (Pill) -->
  <g transform="translate(200, 295)">
    <rect x="-120" y="0" width="240" height="32" rx="16" fill="${accentColor}" filter="url(#shadow)"/>
    <text y="21" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="13" font-weight="900" fill="#ffffff">
      ${category}
    </text>
  </g>

  <!-- Title & Subtitle for Students -->
  <g transform="translate(200, 375)">
    <rect x="-140" y="-30" width="280" height="70" rx="16" fill="#000000" fill-opacity="0.25" filter="url(#shadow)"/>
    <text text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="23" font-weight="900" fill="#ffffff">
      ${title}
    </text>
    <text y="28" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="12" font-weight="700" fill="#fef08a">
      🌟 مناسب برای مطالعه کودکان و نوجوانان
    </text>
  </g>

  <!-- Bottom Stars -->
  <g transform="translate(200, 485)">
    <text text-anchor="middle" font-size="18" fill="#fef08a">⭐ ⭐ ⭐ ⭐ ⭐</text>
    <text y="26" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" fill-opacity="0.85">
      امانت و اشتراک‌گذاری بین همکلاسی‌ها
    </text>
  </g>

  <!-- Book Spine 3D Shadow -->
  <rect x="0" y="0" width="22" height="560" rx="16" fill="url(#spine)"/>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRESET_BOOK_COVERS = [
  {
    label: 'قصه و داستان کودک',
    url: createSvgCover('داستان و قصه کودک', 'دنیای قصه‌ها و ماجراجویی', '#0284c7', '#0369a1', '#f59e0b', '🦁', 'stars')
  },
  {
    label: 'ورزش و قهرمانان',
    url: createSvgCover('ورزش، قهرمانان و تندرستی', 'ورزش، انرژی و تندرستی', '#16a34a', '#15803d', '#facc15', '⚽', 'sports')
  },
  {
    label: 'کمیک و ماجرا',
    url: createSvgCover('کمیک و کتاب تصویری', 'ماجراهای مصور و هیجان‌انگیز', '#ea580c', '#c2410c', '#38bdf8', '🚀', 'sparkles')
  },
  {
    label: 'شعر و ترانه کودک',
    url: createSvgCover('شعر و ترانه کودکانه', 'ترانه‌های شاد و آهنگین', '#db2777', '#be185d', '#fef08a', '🎈', 'bubbles')
  },
  {
    label: 'علمی و شگفتی‌ها',
    url: createSvgCover('علمی و رازهای جهان', 'کاشفان جوان و نجوم', '#7c3aed', '#6d28d9', '#4ade80', '🪐', 'stars')
  },
  {
    label: 'سرگرمی و هوش',
    url: createSvgCover('سرگرمی، بازی و معما', 'چیستان، بازی و پرورش هوش', '#0d9488', '#0f766e', '#fbbf24', '🧩', 'sparkles')
  },
  {
    label: 'حیوانات و طبیعت',
    url: createSvgCover('حیوانات و طبیعت', 'شگفتی‌های حیات‌وحش و جنگل', '#059669', '#047857', '#fb923c', '🐼', 'nature')
  },
  {
    label: 'مهارت و زندگی',
    url: createSvgCover('روانشناسی و مهارت زندگی', 'داستان‌های آموزنده و رشد فردی', '#4f46e5', '#3730a3', '#f472b6', '🌱', 'stars')
  }
];

export const DEFAULT_BOOK_COVER = PRESET_BOOK_COVERS[0].url;

export const DEFAULT_AVATARS = {
  studentMale: createSvgCover('دانش‌آموز', 'مکتب‌خانه', '#1e293b', '#0f172a', '#38bdf8', '👦'),
  studentFemale: createSvgCover('دانش‌آموز', 'مکتب‌خانه', '#3b0764', '#1e1b4b', '#f472b6', '👧'),
  admin: createSvgCover('مدیر مکتب‌خانه', 'راهبر سامانه', '#78350f', '#1e1b4b', '#fbbf24', '👑')
};

// Fallback helper for broken image URLs
export const getSafeImageUrl = (src?: string | null, fallbackType: 'book' | 'avatar' = 'book'): string => {
  if (!src) return fallbackType === 'book' ? DEFAULT_BOOK_COVER : DEFAULT_AVATARS.studentMale;
  // If it's a known blocked Unsplash URL, immediately swap with safe SVG
  if (src.includes('unsplash.com')) {
    return fallbackType === 'book' ? DEFAULT_BOOK_COVER : DEFAULT_AVATARS.studentMale;
  }
  return src;
};
