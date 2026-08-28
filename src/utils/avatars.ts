import { CustomAvatar } from '../types';

export interface AvatarOption {
  id: string;
  name: string; // Left blank or short label without human personal names as requested
  description: string;
  bg: string;
  url: string;
  isCustom?: boolean;
}

export const ADMIN_SPECIAL_AVATARS: AvatarOption[] = [
  {
    id: 'avatar_admin_royal',
    name: 'آواتار ویژه راهبر مکتب‌خانه',
    description: 'آواتار ۳ بعدی اختصاصی مدیریت و راهبری با ردای زرین و نشان کتاب خرد',
    bg: 'bg-amber-100 border-amber-400',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bgAdmin" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="60%" stop-color="%23d97706"/><stop offset="100%" stop-color="%2378350f"/></radialGradient>
        <linearGradient id="skinAdmin" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <linearGradient id="robeAdmin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient>
        <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fef08a"/><stop offset="100%" stop-color="%23eab308"/></linearGradient>
        <filter id="shadowAdmin" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bgAdmin)"/>
      <circle cx="60" cy="60" r="53" fill="none" stroke="%23fef08a" stroke-width="2.5" opacity="0.8"/>
      <!-- Royal Dark Robe with Gold Trim -->
      <path d="M22,108 C22,80 38,72 60,72 C82,72 98,80 98,108 Z" fill="url(%23robeAdmin)" filter="url(%23shadowAdmin)"/>
      <path d="M48,72 L60,94 L72,72" fill="none" stroke="url(%23goldTrim)" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Gold Medal of Wisdom -->
      <circle cx="60" cy="98" r="7" fill="url(%23goldTrim)" filter="url(%23shadowAdmin)"/>
      <text x="60" y="101" font-size="7" font-weight="bold" fill="%2378350f" text-anchor="middle">👑</text>
      <!-- Head & Skin -->
      <rect x="52" y="64" width="16" height="18" rx="6" fill="url(%23skinAdmin)"/>
      <ellipse cx="60" cy="48" rx="26" ry="28" fill="url(%23skinAdmin)" filter="url(%23shadowAdmin)"/>
      <!-- Neat Scholarly Hair -->
      <path d="M34,36 C34,22 45,16 60,16 C75,16 86,22 86,36 Z" fill="%2327272a"/>
      <!-- Big Golden Crown of Leadership -->
      <polygon points="38,20 44,6 52,14 60,4 68,14 76,6 82,20" fill="url(%23goldTrim)" stroke="%23ca8a04" stroke-width="1.5" filter="url(%23shadowAdmin)"/>
      <circle cx="60" cy="6" r="2.5" fill="%23ef4444"/>
      <circle cx="44" cy="8" r="2" fill="%233b82f6"/>
      <circle cx="76" cy="8" r="2" fill="%2310b981"/>
      <!-- Stylish Smart Glasses -->
      <rect x="36" y="44" width="20" height="13" rx="4" fill="none" stroke="%23d97706" stroke-width="3"/>
      <rect x="64" y="44" width="20" height="13" rx="4" fill="none" stroke="%23d97706" stroke-width="3"/>
      <line x1="56" y1="50" x2="64" y2="50" stroke="%23d97706" stroke-width="3"/>
      <!-- Confident Eyes & Smile -->
      <circle cx="46" cy="50" r="4.5" fill="%230f172a"/>
      <circle cx="74" cy="50" r="4.5" fill="%230f172a"/>
      <circle cx="48" cy="48" r="1.8" fill="%23ffffff"/>
      <circle cx="76" cy="48" r="1.8" fill="%23ffffff"/>
      <path d="M48,62 Q60,70 72,62" stroke="%23b45309" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_admin_wise_owl',
    name: 'آواتار جغد دانای مکتب‌خانه',
    description: 'آواتار ۳ بعدی نماد خرد، دانش و مطالعه با کلاه فارغ‌التحصیلی',
    bg: 'bg-emerald-100 border-emerald-400',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bgOwl" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%2334d399"/><stop offset="100%" stop-color="%23065f46"/></radialGradient>
        <linearGradient id="feather" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2392400e"/><stop offset="100%" stop-color="%23451a03"/></linearGradient>
        <filter id="shadowOwl" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.3"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bgOwl)"/>
      <circle cx="60" cy="60" r="53" fill="none" stroke="%23a7f3d0" stroke-width="2.5" opacity="0.8"/>
      <!-- Owl Body -->
      <ellipse cx="60" cy="68" rx="34" ry="36" fill="url(%23feather)" filter="url(%23shadowOwl)"/>
      <ellipse cx="60" cy="74" rx="22" ry="24" fill="%23fef3c7"/>
      <!-- Huge Glasses -->
      <circle cx="45" cy="54" r="16" fill="%23ffffff" stroke="%23f59e0b" stroke-width="3.5" filter="url(%23shadowOwl)"/>
      <circle cx="75" cy="54" r="16" fill="%23ffffff" stroke="%23f59e0b" stroke-width="3.5" filter="url(%23shadowOwl)"/>
      <line x1="61" y1="54" x2="59" y2="54" stroke="%23f59e0b" stroke-width="4"/>
      <!-- Sparkle Eyes -->
      <circle cx="45" cy="54" r="9" fill="%231e293b"/>
      <circle cx="75" cy="54" r="9" fill="%231e293b"/>
      <circle cx="48" cy="51" r="3.5" fill="%23ffffff"/>
      <circle cx="78" cy="51" r="3.5" fill="%23ffffff"/>
      <!-- Beak -->
      <polygon points="60,60 55,68 65,68" fill="%23f97316"/>
      <!-- Grad Hat (Mortarboard) -->
      <polygon points="60,12 94,22 60,32 26,22" fill="%231e1b4b" filter="url(%23shadowOwl)"/>
      <rect x="46" y="28" width="28" height="10" rx="3" fill="%230f172a"/>
      <circle cx="60" cy="22" r="3" fill="%23fbbf24"/>
      <line x1="60" y1="22" x2="84" y2="34" stroke="%23fbbf24" stroke-width="2.5"/>
      <circle cx="84" cy="35" r="2.5" fill="%23ef4444"/>
    </svg>`
  }
];

// Student 3D Cartoon Avatars (Elementary School Level)
export const STUDENT_AVATARS: AvatarOption[] = [
  {
    id: 'avatar_curly_glasses',
    name: '',
    description: 'آواتار ۳ بعدی فرفری با عینک گرد و لبخند دوست‌داشتنی',
    bg: 'bg-cyan-100 border-cyan-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg1" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%230284c7"/></radialGradient>
        <linearGradient id="skin1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23ffedd5"/></linearGradient>
        <linearGradient id="hair1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23854d0e"/><stop offset="100%" stop-color="%233f2305"/></linearGradient>
        <linearGradient id="cloth1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%230e7490"/></linearGradient>
        <filter id="shadow1" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg1)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="url(%23cloth1)" filter="url(%23shadow1)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin1)"/>
      <ellipse cx="60" cy="48" rx="27" ry="29" fill="url(%23skin1)" filter="url(%23shadow1)"/>
      <!-- 3D Curly Hair Tufts -->
      <circle cx="36" cy="30" r="12" fill="url(%23hair1)"/>
      <circle cx="50" cy="22" r="14" fill="url(%23hair1)"/>
      <circle cx="70" cy="22" r="14" fill="url(%23hair1)"/>
      <circle cx="84" cy="30" r="12" fill="url(%23hair1)"/>
      <circle cx="30" cy="42" r="10" fill="url(%23hair1)"/>
      <circle cx="90" cy="42" r="10" fill="url(%23hair1)"/>
      <!-- Cute Glasses -->
      <circle cx="47" cy="48" r="11" fill="none" stroke="%230f172a" stroke-width="3.5"/>
      <circle cx="73" cy="48" r="11" fill="none" stroke="%230f172a" stroke-width="3.5"/>
      <line x1="58" y1="48" x2="62" y2="48" stroke="%230f172a" stroke-width="3.5"/>
      <!-- Sparkle Big Eyes -->
      <circle cx="47" cy="48" r="4.5" fill="%230f172a"/>
      <circle cx="73" cy="48" r="4.5" fill="%230f172a"/>
      <circle cx="49" cy="46" r="1.8" fill="%23ffffff"/>
      <circle cx="75" cy="46" r="1.8" fill="%23ffffff"/>
      <!-- Cute Blush & Mouth -->
      <circle cx="37" cy="54" r="5" fill="%23f43f5e" opacity="0.45"/>
      <circle cx="83" cy="54" r="5" fill="%23f43f5e" opacity="0.45"/>
      <path d="M49,60 Q60,68 71,60" stroke="%23ea580c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_golden_crown',
    name: '',
    description: 'آواتار ۳ بعدی شاهزاده کتاب با تاج طلایی و عینک فانتزی',
    bg: 'bg-purple-100 border-purple-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg2" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23c084fc"/><stop offset="100%" stop-color="%236b21a8"/></radialGradient>
        <linearGradient id="skin2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff1f2"/><stop offset="100%" stop-color="%23ffe4e6"/></linearGradient>
        <linearGradient id="crown" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23facc15"/><stop offset="100%" stop-color="%23ca8a04"/></linearGradient>
        <filter id="shadow2" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg2)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%239333ea" filter="url(%23shadow2)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin2)"/>
      <ellipse cx="60" cy="50" rx="27" ry="28" fill="url(%23skin2)" filter="url(%23shadow2)"/>
      <!-- Long Hair Side Locks -->
      <path d="M28,36 C22,55 24,78 28,86 M92,36 C98,55 96,78 92,86" stroke="%23451a03" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M32,38 C32,22 46,18 60,18 C74,18 88,38 88,38 Z" fill="%23451a03"/>
      <!-- 3D Shiny Crown -->
      <polygon points="42,22 47,8 53,16 60,6 67,16 73,8 78,22" fill="url(%23crown)" stroke="%23fef08a" stroke-width="1.5" filter="url(%23shadow2)"/>
      <circle cx="60" cy="8" r="2.5" fill="%23ef4444"/>
      <circle cx="47" cy="10" r="2" fill="%233b82f6"/>
      <circle cx="73" cy="10" r="2" fill="%2310b981"/>
      <!-- Cute Glasses -->
      <rect x="36" y="44" width="20" height="13" rx="4" fill="none" stroke="%23ec4899" stroke-width="3"/>
      <rect x="64" y="44" width="20" height="13" rx="4" fill="none" stroke="%23ec4899" stroke-width="3"/>
      <line x1="56" y1="50" x2="64" y2="50" stroke="%23ec4899" stroke-width="3"/>
      <!-- Sparkle Eyes -->
      <circle cx="46" cy="50" r="4" fill="%230f172a"/>
      <circle cx="74" cy="50" r="4" fill="%230f172a"/>
      <circle cx="48" cy="48" r="1.5" fill="%23ffffff"/>
      <circle cx="76" cy="48" r="1.5" fill="%23ffffff"/>
      <!-- Happy Smile -->
      <path d="M49,62 Q60,68 71,62" stroke="%23db2777" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_cap_orange',
    name: '',
    description: 'آواتار ۳ بعدی اسپرت با کلاه کپ برعکس و انرژی بالا',
    bg: 'bg-orange-100 border-orange-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg3" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23fb923c"/><stop offset="100%" stop-color="%23c2410c"/></radialGradient>
        <linearGradient id="skin3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f97316"/><stop offset="100%" stop-color="%239a3412"/></linearGradient>
        <filter id="shadow3" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg3)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%230284c7" filter="url(%23shadow3)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin3)"/>
      <ellipse cx="60" cy="50" rx="26" ry="27" fill="url(%23skin3)" filter="url(%23shadow3)"/>
      <!-- Backward Cap 3D -->
      <path d="M34,42 C34,24 46,18 60,18 C74,18 86,24 86,42 Z" fill="url(%23capGrad)"/>
      <path d="M24,40 C32,40 40,44 60,44 C80,44 88,40 96,40" fill="%23ea580c" filter="url(%23shadow3)"/>
      <circle cx="60" cy="18" r="4.5" fill="%23fef08a"/>
      <!-- Big Sparkle Anime Eyes -->
      <ellipse cx="46" cy="50" rx="4.5" ry="5.5" fill="%231e293b"/>
      <ellipse cx="74" cy="50" rx="4.5" ry="5.5" fill="%231e293b"/>
      <circle cx="48" cy="48" r="2" fill="%23ffffff"/>
      <circle cx="76" cy="48" r="2" fill="%23ffffff"/>
      <circle cx="44" cy="52" r="1" fill="%23ffffff"/>
      <circle cx="72" cy="52" r="1" fill="%23ffffff"/>
      <!-- Cute Smile & Blush -->
      <circle cx="36" cy="56" r="4.5" fill="%23f43f5e" opacity="0.4"/>
      <circle cx="84" cy="56" r="4.5" fill="%23f43f5e" opacity="0.4"/>
      <path d="M47,60 Q60,70 73,60" stroke="%239a3412" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_headset_gamer',
    name: '',
    description: 'آواتار ۳ بعدی با هدفون گیمینگ فیروزه‌ای و چهره خندان',
    bg: 'bg-sky-100 border-sky-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg4" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%230369a1"/></radialGradient>
        <linearGradient id="skin4" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <linearGradient id="headsetGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2322d3ee"/><stop offset="100%" stop-color="%230891b2"/></linearGradient>
        <filter id="shadow4" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg4)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%23ea580c" filter="url(%23shadow4)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin4)"/>
      <ellipse cx="60" cy="48" rx="26" ry="28" fill="url(%23skin4)" filter="url(%23shadow4)"/>
      <!-- Cool Hair -->
      <path d="M34,36 C34,22 45,18 60,18 C75,18 86,22 86,36 Z" fill="%231e1b4b"/>
      <!-- 3D Headset -->
      <path d="M28,48 A34,34 0 0,1 92,48" stroke="url(%23headsetGrad)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="23" y="42" width="12" height="22" rx="5" fill="%230891b2" filter="url(%23shadow4)"/>
      <rect x="85" y="42" width="12" height="22" rx="5" fill="%230891b2" filter="url(%23shadow4)"/>
      <circle cx="29" cy="53" r="3" fill="%23a5f3fc"/>
      <circle cx="91" cy="53" r="3" fill="%23a5f3fc"/>
      <!-- Sparkle Eyes & Smile -->
      <circle cx="47" cy="49" r="4.5" fill="%230f172a"/>
      <circle cx="73" cy="49" r="4.5" fill="%230f172a"/>
      <circle cx="49" cy="47" r="1.8" fill="%23ffffff"/>
      <circle cx="75" cy="47" r="1.8" fill="%23ffffff"/>
      <path d="M49,59 Q60,67 71,59" stroke="%23c2410c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_bunny_hoodie',
    name: '',
    description: 'آواتار ۳ بعدی با هودی خرگوشی بانمک و گونه‌های سرخ',
    bg: 'bg-emerald-100 border-emerald-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg5" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%2334d399"/><stop offset="100%" stop-color="%23059669"/></radialGradient>
        <linearGradient id="skin5" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient>
        <filter id="shadow5" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg5)"/>
      <!-- Bunny Ears 3D -->
      <ellipse cx="45" cy="18" rx="8" ry="18" fill="url(%23hoodieGrad)" filter="url(%23shadow5)"/>
      <ellipse cx="45" cy="18" rx="4" ry="12" fill="%23fbcfe8"/>
      <ellipse cx="75" cy="18" rx="8" ry="18" fill="url(%23hoodieGrad)" filter="url(%23shadow5)"/>
      <ellipse cx="75" cy="18" rx="4" ry="12" fill="%23fbcfe8"/>
      <!-- Body & Hoodie -->
      <path d="M22,108 C22,78 38,70 60,70 C82,70 98,78 98,108 Z" fill="url(%23hoodieGrad)" filter="url(%23shadow5)"/>
      <ellipse cx="60" cy="50" rx="27" ry="27" fill="url(%23skin5)" filter="url(%23shadow5)"/>
      <!-- Big Cute Eyes -->
      <circle cx="46" cy="48" r="5" fill="%230f172a"/>
      <circle cx="74" cy="48" r="5" fill="%230f172a"/>
      <circle cx="48" cy="46" r="2" fill="%23ffffff"/>
      <circle cx="76" cy="46" r="2" fill="%23ffffff"/>
      <!-- Rosy Cheeks -->
      <circle cx="36" cy="54" r="5" fill="%23f43f5e" opacity="0.5"/>
      <circle cx="84" cy="54" r="5" fill="%23f43f5e" opacity="0.5"/>
      <path d="M48,58 C54,66 66,66 72,58 Z" fill="%239a3412"/>
    </svg>`
  },
  {
    id: 'avatar_space_bubble',
    name: '',
    description: 'آواتار ۳ بعدی کاشف فضایی با کلاه شیشه‌ای رفلکس‌دار',
    bg: 'bg-indigo-100 border-indigo-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg6" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23818cf8"/><stop offset="100%" stop-color="%233730a3"/></radialGradient>
        <linearGradient id="skin6" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <filter id="shadow6" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg6)"/>
      <!-- Suit -->
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%23f1f5f9" filter="url(%23shadow6)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin6)"/>
      <ellipse cx="60" cy="48" rx="25" ry="27" fill="url(%23skin6)"/>
      <!-- Space Helmet Bubble 3D -->
      <circle cx="60" cy="48" r="35" fill="none" stroke="%2338bdf8" stroke-width="4.5" filter="url(%23shadow6)"/>
      <path d="M38,25 Q50,20 62,25" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.75"/>
      <!-- Cute Eyes & Mouth -->
      <circle cx="47" cy="48" r="4.5" fill="%230f172a"/>
      <circle cx="73" cy="48" r="4.5" fill="%230f172a"/>
      <circle cx="49" cy="46" r="1.8" fill="%23ffffff"/>
      <circle cx="75" cy="46" r="1.8" fill="%23ffffff"/>
      <path d="M49,58 Q60,66 71,58" stroke="%236366f1" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_yellow_beanie',
    name: '',
    description: 'آواتار ۳ بعدی با کلاه زمستانی لیمویی و عینک مطالعه',
    bg: 'bg-amber-100 border-amber-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg7" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23facc15"/><stop offset="100%" stop-color="%23b45309"/></radialGradient>
        <linearGradient id="skin7" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <filter id="shadow7" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg7)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%231e1b4b" filter="url(%23shadow7)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin7)"/>
      <ellipse cx="60" cy="50" rx="26" ry="27" fill="url(%23skin7)" filter="url(%23shadow7)"/>
      <!-- Beanie Hat 3D -->
      <path d="M34,40 C34,20 46,15 60,15 C74,15 86,20 86,40 Z" fill="%23eab308"/>
      <rect x="30" y="36" width="60" height="9" rx="4.5" fill="%23ca8a04" filter="url(%23shadow7)"/>
      <circle cx="60" cy="13" r="6" fill="%23fef08a" filter="url(%23shadow7)"/>
      <!-- Round Blue Glasses -->
      <circle cx="45" cy="50" r="10" fill="none" stroke="%230284c7" stroke-width="3"/>
      <circle cx="75" cy="50" r="10" fill="none" stroke="%230284c7" stroke-width="3"/>
      <line x1="55" y1="50" x2="65" y2="50" stroke="%230284c7" stroke-width="3"/>
      <!-- Sparkle Eyes -->
      <circle cx="45" cy="50" r="4" fill="%230f172a"/>
      <circle cx="75" cy="50" r="4" fill="%230f172a"/>
      <circle cx="47" cy="48" r="1.5" fill="%23ffffff"/>
      <circle cx="77" cy="48" r="1.5" fill="%23ffffff"/>
      <path d="M49,61 Q60,67 71,61" stroke="%23b45309" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'avatar_artist_beret',
    name: '',
    description: 'آواتار ۳ بعدی هنرمند خلاق با کلاه بره قرمز و عینک زرد',
    bg: 'bg-rose-100 border-rose-300',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <defs>
        <radialGradient id="bg8" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="%23fb7185"/><stop offset="100%" stop-color="%239f1239"/></radialGradient>
        <linearGradient id="skin8" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23fff7ed"/><stop offset="100%" stop-color="%23fed7aa"/></linearGradient>
        <filter id="shadow8" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.25"/></filter>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(%23bg8)"/>
      <path d="M22,108 C22,82 40,74 60,74 C80,74 98,82 98,108 Z" fill="%23e11d48" filter="url(%23shadow8)"/>
      <rect x="52" y="65" width="16" height="18" rx="6" fill="url(%23skin8)"/>
      <ellipse cx="60" cy="50" rx="26" ry="27" fill="url(%23skin8)" filter="url(%23shadow8)"/>
      <!-- Red Beret Hat 3D -->
      <path d="M28,38 C28,24 44,18 70,22 C88,25 94,36 84,42 C70,44 34,44 28,38 Z" fill="%23be123c" filter="url(%23shadow8)"/>
      <circle cx="60" cy="18" r="3" fill="%23fda4af"/>
      <!-- Cute Eyes & Glasses -->
      <circle cx="47" cy="50" r="4.5" fill="%230f172a"/>
      <circle cx="73" cy="50" r="4.5" fill="%230f172a"/>
      <circle cx="49" cy="48" r="1.8" fill="%23ffffff"/>
      <circle cx="75" cy="48" r="1.8" fill="%23ffffff"/>
      <circle cx="37" cy="55" r="4.5" fill="%23f43f5e" opacity="0.45"/>
      <circle cx="83" cy="55" r="4.5" fill="%23f43f5e" opacity="0.45"/>
      <path d="M48,60 Q60,68 72,60" stroke="%23be123c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    </svg>`
  }
];

export const FANTASY_AVATARS: AvatarOption[] = [...ADMIN_SPECIAL_AVATARS, ...STUDENT_AVATARS];

export const getAvailableAvatars = (
  isAdmin: boolean = false,
  customAvatars: CustomAvatar[] = []
): AvatarOption[] => {
  const formattedCustom: AvatarOption[] = (customAvatars || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.name,
    bg: c.bg || 'bg-amber-100 border-amber-300',
    url: c.url,
    isCustom: true
  }));

  if (isAdmin) {
    return [...formattedCustom, ...ADMIN_SPECIAL_AVATARS, ...STUDENT_AVATARS];
  }
  return [...formattedCustom, ...STUDENT_AVATARS];
};

export const isAdminAvatar = (urlOrId?: string): boolean => {
  if (!urlOrId) return false;
  return ADMIN_SPECIAL_AVATARS.some((a) => a.id === urlOrId || a.url === urlOrId);
};

export const getDefaultAvatar = (id: string = 'avatar_curly_glasses') => {
  const found = STUDENT_AVATARS.find((a) => a.id === id) || FANTASY_AVATARS.find((a) => a.id === id);
  return found ? found.url : STUDENT_AVATARS[0].url;
};

export const BOY_AVATARS = STUDENT_AVATARS;
