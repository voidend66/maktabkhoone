// High quality, self-contained SVG Data URI book covers and avatars
// Guaranteed to load instantly 100% offline, on any local server, intranet, or filtered network without external CDN dependencies.

export const createSvgCover = (
  title: string,
  category: string,
  gradientStart: string,
  gradientEnd: string,
  accentColor: string,
  iconSymbol: string
): string => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradientStart}"/>
      <stop offset="100%" stop-color="${gradientEnd}"/>
    </linearGradient>
    <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="400" height="560" rx="8" fill="url(#bg)"/>

  <!-- Ornate Frame Borders -->
  <rect x="24" y="24" width="352" height="512" rx="6" fill="none" stroke="url(#gold)" stroke-width="2" stroke-opacity="0.6"/>
  <rect x="30" y="30" width="340" height="500" rx="4" fill="none" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.3" stroke-dasharray="6,4"/>

  <!-- Corner Ornaments -->
  <circle cx="30" cy="30" r="4" fill="${accentColor}"/>
  <circle cx="370" cy="30" r="4" fill="${accentColor}"/>
  <circle cx="30" cy="530" r="4" fill="${accentColor}"/>
  <circle cx="370" cy="530" r="4" fill="${accentColor}"/>

  <!-- Central Symbol / Medallion -->
  <g transform="translate(200, 180)">
    <circle r="52" fill="#000000" fill-opacity="0.2" filter="url(#shadow)"/>
    <circle r="48" fill="url(#gold)" fill-opacity="0.15" stroke="url(#gold)" stroke-width="2"/>
    <circle r="40" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-dasharray="4,3"/>
    <text y="14" text-anchor="middle" font-size="38" fill="#ffffff">${iconSymbol}</text>
  </g>

  <!-- Title & Category (Persian Typography) -->
  <g transform="translate(200, 310)">
    <rect x="-130" y="0" width="260" height="30" rx="15" fill="#ffffff" fill-opacity="0.12"/>
    <text y="20" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="14" font-weight="bold" fill="${accentColor}">
      ${category}
    </text>
  </g>

  <g transform="translate(200, 380)">
    <text text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="22" font-weight="900" fill="#ffffff" filter="url(#shadow)">
      ${title}
    </text>
    <text y="40" text-anchor="middle" font-family="Vazirmatn, Tahoma, sans-serif" font-size="13" font-weight="600" fill="#ffffff" fill-opacity="0.75">
      کتابخانه مشارکتی مکتب‌خانه
    </text>
  </g>

  <!-- Bottom Stamp -->
  <g transform="translate(200, 485)">
    <line x1="-60" y1="0" x2="60" y2="0" stroke="url(#gold)" stroke-width="1.5" stroke-opacity="0.5"/>
    <polygon points="0,-6 6,0 0,6 -6,0" fill="${accentColor}"/>
  </g>

  <!-- Realistic Book Spine 3D Shadow Overlay -->
  <rect x="0" y="0" width="26" height="560" fill="url(#spine)"/>
</svg>
`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const PRESET_BOOK_COVERS = [
  {
    label: 'داستان و رمان',
    url: createSvgCover('داستان و رمان', 'گنجینه ادبیات و قصه', '#1e1b4b', '#312e81', '#f59e0b', '📖')
  },
  {
    label: 'فلسفه و تفکر',
    url: createSvgCover('فلسفه و تفکر', 'حکمت و اندیشه', '#14532d', '#064e3b', '#34d399', '✨')
  },
  {
    label: 'علمی و کیهان',
    url: createSvgCover('علمی و کیهان', 'رازهای جهان و دانش', '#0c4a6e', '#1e3a8a', '#38bdf8', '🪐')
  },
  {
    label: 'کلاسیک و شعر',
    url: createSvgCover('کلاسیک و شعر', 'بوستان ادب پارسی', '#701a75', '#4a044e', '#f472b6', '🪶')
  },
  {
    label: 'تاریخ و معاصر',
    url: createSvgCover('تاریخ و سرگذشت', 'روایت‌های ماندگار', '#78350f', '#451a03', '#fbbf24', '🏛️')
  },
  {
    label: 'روانشناسی و رشد',
    url: createSvgCover('روانشناسی و مهارت', 'انگیزه و پرورش ذهن', '#0f766e', '#134e4a', '#2dd4bf', '🌱')
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
