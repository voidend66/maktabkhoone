import React from 'react';

interface NotFoundPageProps {
  onGoBack?: () => void;
}

export function NotFoundPage({ onGoBack }: NotFoundPageProps) {
  return (
    <main
      className="relative w-full min-h-[100svh] bg-black overflow-x-hidden overflow-y-auto select-none"
      style={{
        fontFamily: '"Geist Mono:SemiBold", monospace',
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          opacity: 1,
          zIndex: 0,
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4"
      />

      {/* Header Logo */}
      <header
        className="absolute left-1/2 -translate-x-1/2 top-8 sm:top-20 z-10 flex items-center justify-center scale-75 sm:scale-100 origin-center pointer-events-auto"
        style={{
          width: '233px',
          height: '40px',
        }}
      >
        <div
          className="flex items-center gap-[14px] w-[233px] h-[40px]"
          aria-label="LGPSM"
        >
          {/* Pixel-like Symbol Mark */}
          <svg
            viewBox="0 0 54 40"
            fill="none"
            className="w-[54px] h-[40px] shrink-0"
            aria-hidden="true"
          >
            <path d="M38 0H26V12H38V0Z" fill="white" />
            <path d="M54 12H38V28H54V12Z" fill="white" />
            <path d="M38 28H26V40H38V28Z" fill="white" />
            <path d="M26 12H16V22H26V12Z" fill="white" />
            <path d="M16 22H8V30H16V22Z" fill="white" />
            <path d="M16 2H6V12H16V2Z" fill="white" />
            <path d="M6 12H0V18H6V12Z" fill="white" />
          </svg>

          {/* Logotype */}
          <svg
            viewBox="0 0 164.311 100"
            fill="none"
            className="w-[165px] h-[40px] shrink-0"
            aria-hidden="true"
          >
            <path
              d="M122.498 37.4573H131.321L139.533 51.6222L147.772 37.4573H156.595V56.0604H152.449V37.6433L141.739 56.0604H137.354L126.617 37.6433V56.0604H122.498V37.4573ZM95.921 48.8317C92.785 48.8317 90.261 46.307 90.261 43.1445C90.261 40.0086 92.785 37.4573 95.921 37.4573H119.972V41.6031H95.921C95.071 41.6031 94.38 42.2941 94.38 43.1445C94.38 44.0215 95.071 44.7125 95.921 44.7125H114.285C117.421 44.7125 119.972 47.2372 119.972 50.3997C119.972 53.5357 117.421 56.0604 114.285 56.0604H90.261V51.9411H114.285C115.136 51.9411 115.827 51.2501 115.827 50.3997C115.827 49.5227 115.136 48.8317 114.285 48.8317H95.921ZM80.857 37.4573C84.843 37.4573 88.086 40.6995 88.086 44.7125C88.086 48.6989 84.843 51.9411 80.857 51.9411H62.254V56.0604H58.135V37.4573H80.857ZM80.83 47.7953C82.558 47.7953 83.94 46.4133 83.94 44.7125C83.94 42.985 82.558 41.6031 80.83 41.6031H62.254V47.7953H80.83ZM35.975 41.6031C33.105 41.6031 30.7927 43.9152 30.7927 46.7588C30.7927 49.629 33.105 51.9411 35.975 51.9411H51.336V48.6989H35.576V44.5796H55.482V56.0604H35.975C30.8192 56.0604 26.6734 51.9145 26.6734 46.7588C26.6734 41.6297 30.8192 37.4573 35.975 37.4573H55.482V41.6031H35.975ZM0 56.0604V37.4573H4.1192V51.9411H24.9281V56.0604H0ZM164.311 36.4177C164.311 37.7529 163.228 38.8354 161.893 38.8354C160.558 38.8354 159.475 37.7529 159.475 36.4177C159.475 35.0824 160.558 34 161.893 34C163.228 34 164.311 35.0824 164.311 36.4177Z"
              fill="white"
            />
          </svg>
        </div>
      </header>

      {/* Centered 404 Content */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center gap-[28px] sm:gap-[44px] w-[min(100%-40px,360px)] sm:w-[483px]"
      >
        {/* 404 Heading */}
        <h1
          className="font-semibold select-none leading-[1.1] pb-2 text-[clamp(140px,52vw,200px)] tracking-[-0.09em] sm:text-[295.751px] sm:tracking-[-24.6459px]"
          style={{
            fontFamily: '"Geist Mono:SemiBold", monospace',
            background:
              'linear-gradient(247.3282658084845deg, rgb(255, 255, 255) 2.5334%, rgba(255, 255, 255, 0.4) 93.612%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            height: 'auto',
            minHeight: 0,
          }}
        >
          404
        </h1>

        {/* Divider */}
        <div
          className="w-full sm:w-[425px] h-[1px] bg-white shrink-0"
          role="separator"
        />

        {/* Message */}
        <p
          className="text-white text-center font-black leading-[1.3] text-[clamp(16px,4.5vw,22px)] tracking-tight sm:text-[23px] w-full"
          style={{
            fontFamily: '"Geist Mono:SemiBold", "Vazirmatn", "Segoe UI", system-ui, sans-serif',
            fontWeight: 900,
            textRendering: 'geometricPrecision',
            WebkitFontSmoothing: 'antialiased',
          }}
          dir="rtl"
        >
          شاید این مسیر به بن‌بست رسیده باشه، ولی مسیر اصلی پابرجاست! <span className="opacity-80 font-bold text-[0.88em] inline-block tracking-normal">(صفحه پیدا نشد)</span>
        </p>
      </div>
    </main>
  );
}
