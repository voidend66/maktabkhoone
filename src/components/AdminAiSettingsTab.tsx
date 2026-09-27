import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocalAiConfig, Book, AiHealthCheckResult, InstalledOllamaModel } from '../types';
import { getSafeImageUrl, DEFAULT_BOOK_COVER } from '../utils/coverPresets';
import {
  Bot,
  Sparkles,
  Server,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  Cpu,
  BookOpen,
  HelpCircle,
  Layers,
  Terminal,
  Activity,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AdminAiSettingsTab: React.FC = () => {
  const { systemConfig, updateSystemConfig, testAiConnection, checkAiHealth, getAiBookRecommendations } = useApp();

  const currentAiConfig = systemConfig?.aiConfig || {
    enabled: true,
    endpointUrl: 'http://192.168.100.54:11434/api/generate',
    modelName: 'qwen2.5:7b',
    systemPrompt: 'تو پیشنهاددهنده کتاب مکتبخانه هستی. فقط بر اساس دیتای ارائه شده پیشنهاد بده و خروجی را الزاماً به صورت یک شیء معتبر JSON تولید کن.',
    numPredict: 350,
    temperature: 0.3,
    topP: 0.9,
    repeatPenalty: 1.1,
    maxCandidates: 14,
    timeoutSeconds: 90
  };

  const [enabled, setEnabled] = useState<boolean>(currentAiConfig.enabled ?? true);
  const [endpointUrl, setEndpointUrl] = useState<string>(currentAiConfig.endpointUrl || 'http://192.168.100.54:11434/api/generate');
  const [modelName, setModelName] = useState<string>(currentAiConfig.modelName || 'qwen2.5:7b');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    currentAiConfig.systemPrompt ||
    'تو پیشنهاددهنده کتاب مکتبخانه هستی. فقط بر اساس دیتای ارائه شده پیشنهاد بده و خروجی را الزاماً به صورت یک شیء معتبر JSON تولید کن.'
  );
  const [numPredict, setNumPredict] = useState<number>(currentAiConfig.numPredict || 350);
  const [temperature, setTemperature] = useState<number>(currentAiConfig.temperature ?? 0.3);
  const [topP, setTopP] = useState<number>(currentAiConfig.topP ?? 0.9);
  const [repeatPenalty, setRepeatPenalty] = useState<number>(currentAiConfig.repeatPenalty ?? 1.1);
  const [maxCandidates, setMaxCandidates] = useState<number>(currentAiConfig.maxCandidates || 14);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(currentAiConfig.timeoutSeconds || 90);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Ping Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number | null;
    message: string;
    responseSample?: string;
  } | null>(null);

  // Health Check State
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [healthResult, setHealthResult] = useState<AiHealthCheckResult | null>(null);
  const [showModelsList, setShowModelsList] = useState(true);
  const [copiedText, setCopiedText] = useState<string>('');

  // Playground / Simulator State
  const [testMood, setTestMood] = useState<string>('laugh');
  const [testPrompt, setTestPrompt] = useState<string>('یک رمان ماجراجویی و طنز مدرسه‌ای');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');

    const newAiConfig: LocalAiConfig = {
      enabled,
      endpointUrl: endpointUrl.trim(),
      modelName: modelName.trim(),
      systemPrompt: systemPrompt.trim(),
      numPredict: Math.max(100, Math.min(1000, numPredict)),
      temperature: Number(temperature),
      topP: Number(topP),
      repeatPenalty: Number(repeatPenalty),
      maxCandidates: Math.max(4, Math.min(30, maxCandidates)),
      timeoutSeconds: Math.max(10, Math.min(180, timeoutSeconds))
    };

    try {
      const res = await updateSystemConfig({ aiConfig: newAiConfig });
      if (res && res.success) {
        setSaveSuccessMsg('تنظیمات هوش مصنوعی محلی با موفقیت ذخیره شد.');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testAiConnection({
        endpointUrl: endpointUrl.trim(),
        modelName: modelName.trim(),
        timeoutSeconds: Number(timeoutSeconds)
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'خطا در تست اتصال'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setIsHealthChecking(true);
    try {
      const res = await checkAiHealth({
        endpointUrl: endpointUrl.trim(),
        modelName: modelName.trim()
      });
      setHealthResult(res);
    } catch (err: any) {
      console.error('Health check client error:', err);
    } finally {
      setIsHealthChecking(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await getAiBookRecommendations({
        mood: testMood,
        readingTime: 'medium',
        visualPreference: 'any',
        customPrompt: testPrompt.trim()
      });
      setSimulationResult(res);
    } catch (err: any) {
      setSimulationResult({
        success: false,
        message: err.message || 'خطا در شبیه‌سازی'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetDefaultPrompt = () => {
    setSystemPrompt(
      'تو پیشنهاددهنده کتاب مکتبخانه هستی. فقط بر اساس دیتای ارائه شده پیشنهاد بده و خروجی را الزاماً به صورت یک شیء معتبر JSON تولید کن.'
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                تنظیمات و سلامت‌سنجی هوش مصنوعی محلی (Ollama & Qwen 7B)
              </h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {enabled ? 'فعال در سامانه' : 'غیرفعال'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              مدیریت اتصال به سرور پروکسموکس داخلی، تست سلامت‌سنجی ۴ گانه، پارامترهای مدل Qwen و پشتیبان اضطراری
            </p>
          </div>
        </div>

        {/* Live Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Diagnostic Health Check Button */}
          <button
            type="button"
            onClick={handleRunHealthCheck}
            disabled={isHealthChecking}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isHealthChecking ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال سلامت‌سنجی ۴ گانه...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span>سلامت‌سنجی جامع سرور</span>
              </>
            )}
          </button>

          {/* Quick Ping Button */}
          <button
            type="button"
            onClick={handlePingTest}
            disabled={isTesting}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span>پینگ سریع</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Health Check Suite Banner (if tested) */}
      {healthResult && (
        <div className={`p-5 rounded-3xl border text-xs leading-relaxed space-y-4 animate-in fade-in duration-300 ${
          healthResult.overallStatus === 'healthy'
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            : healthResult.overallStatus === 'degraded'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
            : 'bg-rose-50/80 border-rose-300 text-rose-950'
        }`}>
          {/* Main Health Status Summary Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-black/10">
            <div className="flex items-center gap-2.5">
              <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                healthResult.overallStatus === 'healthy'
                  ? 'bg-emerald-600 animate-ping'
                  : healthResult.overallStatus === 'degraded'
                  ? 'bg-amber-600 animate-ping'
                  : 'bg-rose-600 animate-ping'
              }`} />
              <div>
                <div className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                  <span>
                    {healthResult.overallStatus === 'healthy' && '✅ وضعیت سرور: کاملاً سالم، آنلاین و متصل (Healthy)'}
                    {healthResult.overallStatus === 'degraded' && '⚠️ وضعیت سرور: آنلاین با هشدار بررسی مدل (Degraded)'}
                    {healthResult.overallStatus === 'offline' && '❌ وضعیت سرور: خاموش یا خارج از دسترس شبکه (Offline)'}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    ({healthResult.timestampFa || 'هم‌اکنون'})
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5">{healthResult.summary}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunHealthCheck}
              disabled={isHealthChecking}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl text-xs font-bold border border-black/10 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isHealthChecking ? 'animate-spin' : ''}`} />
              <span>تست مجدد</span>
            </button>
          </div>

          {/* 4 Pillars Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* 1. HTTP Web Server Ping */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>۱. اتصال وب‌سرور و پورت ۱۱۴۳۴</span>
                </div>
                {healthResult.steps.ping.success ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>پاسخ داد ({healthResult.steps.ping.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>عدم پاسخ</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.ping.message}
              </p>
            </div>

            {/* 2. Models Check */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <HardDrive className="w-4 h-4 text-purple-600" />
                  <span>۲. مخزن مدل‌ها ({healthResult.targetModel})</span>
                </div>
                {healthResult.steps.models.targetModelFound ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>مدل موجود است</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>نیاز به بررسی</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.models.message}
              </p>

              {/* Installed Models Tags Pill List */}
              {healthResult.steps.models.installedModels?.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500">مدل‌های شناسایی‌شده روی سرور شما:</span>
                    <button
                      type="button"
                      onClick={() => setShowModelsList(!showModelsList)}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showModelsList ? 'بستن لیست' : 'مشاهده لیست'}</span>
                      {showModelsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                  {showModelsList && (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {healthResult.steps.models.installedModels.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModelName(m.name)}
                          title={`کلیک برای انتخاب این مدل (حجم: ${m.sizeFormatted})`}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-1.5 border cursor-pointer ${
                            modelName === m.name
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Cpu className="w-3 h-3" />
                          <span>{m.name}</span>
                          <span className="text-[9px] opacity-75">({m.sizeFormatted})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Live Inference Check */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  <span>۳. استنتاج و تولید پاسخ زنده</span>
                </div>
                {healthResult.steps.inference.success ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>موفق ({healthResult.steps.inference.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                    غیرفعال
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.inference.message}
              </p>
              {healthResult.steps.inference.sampleResponse && (
                <div className="text-[10px] font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-slate-700 truncate">
                  نمونه تست: {healthResult.steps.inference.sampleResponse}
                </div>
              )}
            </div>

            {/* 4. Resilient Fallback Engine */}
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-black/10 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>۴. موتور پشتیبان اضطراری مکتب‌خانه</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>آماده به خدمت</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {healthResult.steps.fallback.message}
              </p>
              <div className="text-[10px] text-slate-400">
                در صورت هرگونه خاموشی یا بروز تاخیر، بدون معطلی دانش‌آموز کتاب‌های مرتبط ارائه می‌شود.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ping Test Result Banner (Quick Ping) */}
      {testResult && !healthResult && (
        <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-in fade-in duration-200 flex items-start gap-3 ${
          testResult.success
            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
            : 'bg-rose-50 text-rose-950 border-rose-200'
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <strong className="font-black text-xs sm:text-sm">
                {testResult.success ? '✅ پینگ با موفقیت برقرار شد!' : '⚠️ خطا در برقراری پینگ با سرور محلی:'}
              </strong>
              {testResult.latencyMs && (
                <span className="font-mono text-[11px] bg-white/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  زمان پاسخ: {testResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs">{testResult.message}</p>
            {testResult.responseSample && (
              <p className="text-[10px] text-slate-500 font-mono bg-white/60 p-1.5 rounded-lg border border-slate-200/60 truncate">
                نمونه پاسخ مدل: {testResult.responseSample}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Switch */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <label htmlFor="ai_enabled" className="text-xs sm:text-sm font-black text-slate-900 block cursor-pointer">
              فعال‌سازی دستیار هوشمند پیشنهاد کتاب در سایت
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              با فعال بودن این گزینه، بنر و دکمهٔ «کتابدار هوشمند» در صفحه کتابخانه به دانش‌آموزان نمایش داده می‌شود.
            </p>
          </div>
          <input
            id="ai_enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>

        {/* Server & Model Configuration Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* endpointUrl */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-500" />
              <span>آدرس اندپوینت Ollama (شبکه محلی یا اینترنت)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="http://192.168.100.54:11434/api/generate"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            />
            <span className="text-[11px] text-slate-400 block">
              آدرس پیش‌فرض سرور پروکسموکس: <code className="text-slate-600">http://192.168.100.54:11434/api/generate</code>
            </span>
          </div>

          {/* modelName */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>نام مدل (Model Name)</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="qwen2.5:7b"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            />
            <span className="text-[11px] text-slate-400 block">
              نام مدل بارگذاری‌شده در Ollama (مثلاً <code className="text-slate-600">qwen2.5:7b</code> یا <code className="text-slate-600">qwen2.5:3b</code>).
            </span>
          </div>
        </div>

        {/* System Prompt Customizer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-slate-500" />
              <span>پرامپت سیستمی مدل (System Prompt)</span>
            </label>
            <button
              type="button"
              onClick={handleResetDefaultPrompt}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بازنشانی به پیش‌فرض</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
            placeholder="دستورات سطح بالا به مدل..."
          />
          <span className="text-[11px] text-slate-400 block leading-tight">
            این دستور به مدل یادآوری می‌کند که نقش کتابدار مکتب‌خانه را دارد و باید خروجی را فقط به صورت JSON تولید کند.
          </span>
        </div>

        {/* Advanced Hyperparameters Accordion / Section */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>تنظیمات پیشرفته هایپرپارامترها (Hyperparameters)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* temperature */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Temperature (خلاقیت):</span>
                <span className="font-mono text-indigo-600 font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                مقدار کمتر = دقت و التزام بالاتر به فرمت JSON (پیشنهاد: 0.3)
              </span>
            </div>

            {/* topP */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Top-P (تنوع کلمات):</span>
                <span className="font-mono text-indigo-600 font-bold">{topP}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                کنترل تنوع توکن‌ها (پیشنهاد: 0.9)
              </span>
            </div>

            {/* repeatPenalty */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Repeat Penalty:</span>
                <span className="font-mono text-indigo-600 font-bold">{repeatPenalty}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={repeatPenalty}
                onChange={(e) => setRepeatPenalty(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                جلوگیری از تکرار کلمات تکراری (پیشنهاد: 1.1)
              </span>
            </div>

            {/* numPredict */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">حداکثر طول خروجی (Tokens):</span>
                <span className="font-mono text-indigo-600 font-bold">{numPredict}</span>
              </div>
              <input
                type="range"
                min="150"
                max="800"
                step="50"
                value={numPredict}
                onChange={(e) => setNumPredict(parseInt(e.target.value) || 350)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                سقف طول متن تولیدی (پیشنهاد: ۳۵۰ برای پیشنهاد سریع ۳ کتاب)
              </span>
            </div>

            {/* maxCandidates */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">کاندیداهای ارسالی به مدل:</span>
                <span className="font-mono text-indigo-600 font-bold">{maxCandidates} کتاب</span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                step="1"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(parseInt(e.target.value) || 14)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                تعداد کتاب‌های برتر قفسه که در قالب پرامپت به هوش مصنوعی داده می‌شود.
              </span>
            </div>

            {/* timeoutSeconds */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">تایم‌اوت پاسخ (Timeout):</span>
                <span className="font-mono text-indigo-600 font-bold">
                  {timeoutSeconds} ثانیه
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="150"
                step="5"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 90)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                سقف انتظار پاسخ مدل محلی (پیشنهاد: ۹۰ ثانیه، متناسب با زمان تحلیل مدل‌های محلی).
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال ذخیره‌سازی...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>ذخیره تنظیمات هوش مصنوعی</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Linux / Proxmox Terminal Cheatsheet Helper */}
      <div className="p-4 bg-slate-900 rounded-3xl text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-black">جعبه‌ابزار دستورات ترمینال سرور (Proxmox / Armbian)</h4>
          </div>
          <span className="text-[10px] text-slate-400">جهت بررسی مستقیم روی سرور لینوکس</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { label: 'تست پینگ به Ollama از سرور سایت', cmd: 'curl -I http://192.168.100.54:11434' },
            { label: 'مشاهده لیست مدل‌های نصب‌شده در Ollama', cmd: 'curl -s http://192.168.100.54:11434/api/tags' },
            { label: 'بررسی وضعیت سرویس Ollama', cmd: 'sudo systemctl status ollama' },
            { label: 'پایش اشغال پورت 11434 در شبکه', cmd: 'ss -tulpn | grep 11434' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-300 block truncate font-medium">{item.label}</span>
                <code className="text-[11px] text-emerald-400 font-mono block truncate" dir="ltr">{item.cmd}</code>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.cmd)}
                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer shrink-0"
                title="کپی دستور"
              >
                {copiedText === item.cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Simulator Playground (Live Student Testing) */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Play className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">محیط تست زنده خروجی (Simulator Playground)</h4>
            <p className="text-[11px] text-slate-500">
              یک سناریوی فرضی دانش‌آموز را انتخاب کنید تا رفتار مدل Qwen را قبل از دسترسی عمومی دانش‌آموزان آزمایش کنید.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mood selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">حس و حال دانش‌آموز:</label>
              <select
                value={testMood}
                onChange={(e) => setTestMood(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="laugh">می‌خواهم از ته دل بخندم (طنز)</option>
                <option value="curious">کنجکاوم و می‌خواهم معما حل کنم (معمایی)</option>
                <option value="adventure">دنبال ماجراجویی و هیجان بالام (ماجراجویی)</option>
                <option value="deep">به دنبال فکر کردن و درس عبرت هستم (آموزنده)</option>
                <option value="relax">می‌خواهم آرامش بگیرم و قصه گرم بخوانم (آرامش‌بخش)</option>
              </select>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">درخواست اختیاری دانش‌آموز:</label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="مثلاً: کتاب‌های داستان کارآگاهی کوتاه"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال دریافت پیشنهاد از مدل...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>اجرای تست پیشنهاد زنده</span>
              </>
            )}
          </button>

          {/* Simulation Output */}
          {simulationResult && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 flex-wrap gap-2">
                <span className="font-black text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>نتیجه آزمون: {simulationResult.isAiGenerated ? 'تولید شده توسط Qwen 7B' : 'تطابق هوشمند'}</span>
                </span>
                {simulationResult.latencyMs && (
                  <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    تاخیر: {simulationResult.latencyMs}ms | کاندیداها: {simulationResult.candidatesCount} جلد
                  </span>
                )}
              </div>

              {simulationResult.greeting && (
                <p className="text-xs text-indigo-900 font-bold bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                  {simulationResult.greeting}
                </p>
              )}

              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-700 block">کتاب‌های برگزیده مدل:</span>
                {simulationResult.recommendedBooks?.map(({ book, reason }: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-black text-slate-900">
                        {book.title} <span className="text-slate-500 font-normal">({book.author})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        💡 <strong>دلیل مدل:</strong> {reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
