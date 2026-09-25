/**
 * CamScanner Demo Samples
 * Pre-generated realistic student photos of books on carpets, floors, and tables with crooked angles
 * for testing the CamScanner perspective crop and enhancement filters.
 */

export interface DemoSample {
  id: string;
  title: string;
  bookTitle: string;
  bookAuthor: string;
  description: string;
  backgroundType: 'فرش سنتی ایرانی' | 'سرامیک و پارکت کف اتاق' | 'میز تحریر با وسایل اضافی';
  defaultCorners: [
    { x: number; y: number }, // Top-Left
    { x: number; y: number }, // Top-Right
    { x: number; y: number }, // Bottom-Right
    { x: number; y: number }  // Bottom-Left
  ];
  getImageDataUrl: () => string;
}

// Generate realistic synthetic photo of book on Persian carpet with perspective angle
function createCarpetSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw Carpet Background (Persian floral pattern)
  ctx.fillStyle = '#8B1E1E'; // Rich Persian Red
  ctx.fillRect(0, 0, 800, 1000);

  // Carpet pattern grid
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 800; x += 40) {
    for (let y = 0; y < 1000; y += 40) {
      ctx.strokeRect(x, y, 40, 40);
      ctx.fillStyle = (x + y) % 80 === 0 ? '#1A4D2E' : '#A02334';
      ctx.beginPath();
      ctx.arc(x + 20, y + 20, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Carpet fringe border on edges
  ctx.fillStyle = '#F5F5DC';
  for (let i = 0; i < 800; i += 8) {
    ctx.fillRect(i, 0, 3, 25);
    ctx.fillRect(i, 975, 3, 25);
  }

  // Carpet soft texture noise
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, 800, 1000);

  // 2. Drop Shadow of the tilted book
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 18;
  ctx.shadowOffsetY = 22;

  // Book polygon coordinates on the carpet (slanted angle)
  // [140, 180] -> [620, 120] -> [690, 820] -> [180, 890]
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(140, 180);
  ctx.lineTo(620, 120);
  ctx.lineTo(690, 820);
  ctx.lineTo(180, 890);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Draw Book Cover inside the perspective quad
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(140, 180);
  ctx.lineTo(620, 120);
  ctx.lineTo(690, 820);
  ctx.lineTo(180, 890);
  ctx.closePath();
  ctx.clip();

  // Book cover background
  const bookGrad = ctx.createLinearGradient(140, 180, 690, 820);
  bookGrad.addColorStop(0, '#0284c7');
  bookGrad.addColorStop(0.5, '#0369a1');
  bookGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bookGrad;
  ctx.fillRect(100, 100, 650, 850);

  // Book header illustration / design
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(420, 380, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(420, 380, 110, 0, Math.PI * 2);
  ctx.fill();

  // Mathematical formula icon / book graphics
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 70px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('∑ π √', 420, 405);

  // Book Title in Persian
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('ریاضی و آمار دهم', 420, 580);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 30px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('پایه دهم دوره دوم متوسطه', 420, 635);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('وزارت آموزش و پرورش', 420, 750);

  // Natural phone camera lighting & perspective shadow gradient
  const lightGrad = ctx.createLinearGradient(100, 100, 700, 900);
  lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  lightGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
  lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(100, 100, 650, 850);

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

// Generate realistic synthetic photo of book on parquet floor with phone shadow
function createFloorSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d')!;

  // 1. Wood Parquet Floor Background
  const plankWidth = 90;
  for (let x = 0; x < 800; x += plankWidth) {
    const isDark = (x / plankWidth) % 2 === 0;
    ctx.fillStyle = isDark ? '#b45309' : '#d97706';
    ctx.fillRect(x, 0, plankWidth, 1000);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let y = 15; y < 1000; y += 30) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + plankWidth, y + (Math.sin(y) * 5));
      ctx.stroke();
    }

    // Plank separation line
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + plankWidth - 2, 0, 2, 1000);
  }

  // 2. Drop Shadow of the slanted novel
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = -15;
  ctx.shadowOffsetY = 25;

  // Book polygon coordinates on the floor (tilted)
  // [170, 150] -> [670, 210] -> [580, 880] -> [110, 820]
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(170, 150);
  ctx.lineTo(670, 210);
  ctx.lineTo(580, 880);
  ctx.lineTo(110, 820);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Draw Novel Cover inside the polygon
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(170, 150);
  ctx.lineTo(670, 210);
  ctx.lineTo(580, 880);
  ctx.lineTo(110, 820);
  ctx.closePath();
  ctx.clip();

  // Book cover background
  const bookGrad = ctx.createLinearGradient(170, 150, 580, 880);
  bookGrad.addColorStop(0, '#4c1d95');
  bookGrad.addColorStop(0.6, '#6d28d9');
  bookGrad.addColorStop(1, '#831843');
  ctx.fillStyle = bookGrad;
  ctx.fillRect(80, 100, 650, 850);

  // Crescent moon & stars illustration
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(380, 360, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.arc(410, 340, 80, 0, Math.PI * 2);
  ctx.fill();

  // Book Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 55px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('شازده کوچولو', 390, 550);

  ctx.fillStyle = '#fbcfe8';
  ctx.font = 'bold 30px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('آنتوان دو سنت اگزوپری', 390, 615);

  ctx.fillStyle = '#e9d5ff';
  ctx.font = '24px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('ترجمه احمد شاملو • انتشارات نگاه', 390, 740);

  // Student phone camera shadow falling across bottom-right
  const phoneShadow = ctx.createRadialGradient(700, 900, 50, 600, 750, 450);
  phoneShadow.addColorStop(0, 'rgba(0,0,0,0.65)');
  phoneShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = phoneShadow;
  ctx.fillRect(80, 100, 650, 850);

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

// Generate realistic synthetic photo of book on study desk with pen
function createDeskSample(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d')!;

  // 1. Desk Surface (White laminate with subtle texture)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 800, 1000);

  // Desk stationery in background (carpet/surroundings student accidentally captured)
  ctx.fillStyle = '#3b82f6'; // Blue ballpoint pen
  ctx.fillRect(720, 200, 18, 500);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(722, 160, 14, 40);

  // A notebook edge
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(0, 800, 250, 200);
  ctx.strokeStyle = '#94a3b8';
  for (let i = 820; i < 1000; i += 18) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(250, i);
    ctx.stroke();
  }

  // 2. Book Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 12;
  ctx.shadowOffsetY = 18;

  // Book polygon coordinates
  // [160, 140] -> [630, 170] -> [600, 860] -> [130, 810]
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(160, 140);
  ctx.lineTo(630, 170);
  ctx.lineTo(600, 860);
  ctx.lineTo(130, 810);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Book Cover Artwork
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(160, 140);
  ctx.lineTo(630, 170);
  ctx.lineTo(600, 860);
  ctx.lineTo(130, 810);
  ctx.closePath();
  ctx.clip();

  const bookGrad = ctx.createLinearGradient(160, 140, 600, 860);
  bookGrad.addColorStop(0, '#065f46');
  bookGrad.addColorStop(0.5, '#047857');
  bookGrad.addColorStop(1, '#0f766e');
  ctx.fillStyle = bookGrad;
  ctx.fillRect(100, 100, 600, 800);

  // Nature leaf graphic
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(380, 360, 100, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('زیست‌شناسی ۱', 380, 540);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('پایه دهم تجربی', 380, 600);

  ctx.fillStyle = '#fef08a';
  ctx.font = '24px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('کتاب درسی رسمی آموزش و پرورش', 380, 720);

  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const CAMSCANNER_DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'sample_carpet',
    title: 'کتاب روی فرش سنتی (زاویه کج)',
    bookTitle: 'ریاضی و آمار دهم',
    bookAuthor: 'آموزش و پرورش',
    description: 'عکس رایج دانش‌آموزان: کتاب با زاویه مایل روی فرش خانه افتاده و طرح شلوغ فرش کل کادر را پر کرده است.',
    backgroundType: 'فرش سنتی ایرانی',
    defaultCorners: [
      { x: 17.5, y: 18.0 }, // [140/800, 180/1000]
      { x: 77.5, y: 12.0 }, // [620/800, 120/1000]
      { x: 86.2, y: 82.0 }, // [690/800, 820/1000]
      { x: 22.5, y: 89.0 }  // [180/800, 890/1000]
    ],
    getImageDataUrl: createCarpetSample
  },
  {
    id: 'sample_floor',
    title: 'کتاب روی پارکت با سایه دست',
    bookTitle: 'شازده کوچولو',
    bookAuthor: 'آنتوان دو سنت اگزوپری',
    description: 'عکس از بالای زمین با زاویه نامتقارن و افتادن سایه دست و گوشی روی جلد کتاب.',
    backgroundType: 'سرامیک و پارکت کف اتاق',
    defaultCorners: [
      { x: 21.2, y: 15.0 }, // [170/800, 150/1000]
      { x: 83.7, y: 21.0 }, // [670/800, 210/1000]
      { x: 72.5, y: 88.0 }, // [580/800, 880/1000]
      { x: 13.7, y: 82.0 }  // [110/800, 820/1000]
    ],
    getImageDataUrl: createFloorSample
  },
  {
    id: 'sample_desk',
    title: 'کتاب روی میز با وسایل اضافی',
    bookTitle: 'زیست‌شناسی ۱',
    bookAuthor: 'آموزش و پرورش',
    description: 'کتاب با کادربندی نادقیق که خودکار و دفترچه یادداشت اطراف هم در عکس افتاده‌اند.',
    backgroundType: 'میز تحریر با وسایل اضافی',
    defaultCorners: [
      { x: 20.0, y: 14.0 }, // [160/800, 140/1000]
      { x: 78.7, y: 17.0 }, // [630/800, 170/1000]
      { x: 75.0, y: 86.0 }, // [600/800, 860/1000]
      { x: 16.2, y: 81.0 }  // [130/800, 810/1000]
    ],
    getImageDataUrl: createDeskSample
  }
];
