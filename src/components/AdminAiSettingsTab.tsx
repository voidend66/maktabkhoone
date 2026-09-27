import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocalAiConfig, Book } from '../types';
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
  Terminal
} from 'lucide-react';

export const AdminAiSettingsTab: React.FC = () => {
  const { systemConfig, updateSystemConfig, testAiConnection, getAiBookRecommendations } = useApp();

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

  // Playground / Simulator State
  const [testMood, setTestMood] = useState<string>('laugh');
  const [testPrompt, setTestPrompt] = useState<string>('یک رمان ماجراجویی و طنز مدرسه‌ای');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

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
                تنظیمات هوش مصنوعی محلی (Ollama & Qwen 7B)
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
              مدیریت اتصال به سرور پروکسموکس داخلی، پارامترهای مدل Qwen 2.5 7B و تنظیمات پرامپت پیشنهاد کتاب
            </p>
          </div>
        </div>

        {/* Live Ping Button */}
        <button
          type="button"
          onClick={handlePingTest}
          disabled={isTesting}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>در حال ارسال پینگ به سرور...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>تست اتصال زنده (Ping)</span>
            </>
          )}
        </button>
      </div>

      {/* Ping Test Result Banner */}
      {testResult && (
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
                {testResult.success ? '✅ اتصال با موفقیت برقرار شد!' : '⚠️ خطا در برقراری اتصال با سرور محلی:'}
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
            className="w-5 h-5 accent-indigo-600 rounded-md cursor-pointer shrink-0"
          />
        </div>

        {/* Section 1: Server Connection */}
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-600" />
            <span>مشخصات سرور و مدل (Ollama Endpoint):</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-black text-slate-700">
                آدرس اندپوینت سرور محلی (API URL):
              </label>
              <input
                type="text"
                dir="ltr"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="http://192.168.100.54:11434/api/generate"
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 block">
                پیش‌فرض: http://192.168.100.54:11434/api/generate
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-black text-slate-700">
                نام مدل (Model Name):
              </label>
              <input
                type="text"
                dir="ltr"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="qwen2.5:7b"
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 block">
                پیش‌فرض: qwen2.5:7b (مقیم در رم با تأخیر لود صفر)
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Model Inference Tuning Parameters */}
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>پارامترهای تولید متن و بهینه‌سازی توکن‌ها (Options):</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* num_predict */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  سقف توکن خروجی (num_predict):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {numPredict} توکن
                </span>
              </div>
              <input
                type="range"
                min="150"
                max="800"
                step="25"
                value={numPredict}
                onChange={(e) => setNumPredict(parseInt(e.target.value) || 350)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                پیشنهاد: ۳۰۰ تا ۴۵۰ توکن جهت جلوگیری از قطع ناگهانی ساختار JSON.
              </span>
            </div>

            {/* temperature */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  دمای خلاقیت (temperature):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {temperature}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.3)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                پیشنهاد: ۰.۲ تا ۰.۴ جهت پیشنهاد دقیق و بدون توهم.
              </span>
            </div>

            {/* top_p */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  تنوع واژگان (top_p):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {topP}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value) || 0.9)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                کنترل تنوع کلمات (پیش‌فرض: ۰.۹).
              </span>
            </div>

            {/* repeat_penalty */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  جریمه تکرار کلمات (repeat_penalty):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {repeatPenalty}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.5"
                step="0.05"
                value={repeatPenalty}
                onChange={(e) => setRepeatPenalty(parseFloat(e.target.value) || 1.1)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                جلوگیری از تکرار عبارات فارسی (پیش‌فرض: ۱.۱).
              </span>
            </div>

            {/* maxCandidates */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  سقف کتاب‌های ارسالی (Pool):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {maxCandidates} جلد
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                step="2"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(parseInt(e.target.value) || 14)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block leading-tight">
                تعداد کتاب‌های کاندیدای ارسالی به مدل (پیشنهاد: ۱۲ الی ۱۶ جلد).
              </span>
            </div>

            {/* timeoutSeconds */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800">
                  سقف زمان پاسخ (Timeout):
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
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

        {/* Section 3: System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>دستورالعمل سیستمی مدل (System Prompt):</span>
            </label>
            <button
              type="button"
              onClick={handleResetDefaultPrompt}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بازگردانی به پیش‌فرض</span>
            </button>
          </div>

          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-800 font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-[10px] text-slate-400 block">
            نقش مدل و تأکید بر تولید خروجی الزامی در قالب ساختار JSON.
          </span>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'در حال ذخیره تنظیمات...' : 'ذخیره تنظیمات هوش مصنوعی 💾'}
          </button>
        </div>
      </form>

      {/* Simulator / Playground Section */}
      <div className="pt-8 border-t border-slate-200 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-50 rounded-xl text-purple-700 border border-purple-200">
            <Play className="w-5 h-5 fill-purple-600" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm sm:text-base">
              محیط شبیه‌ساز و تست زنده خروجی مدل (Playground)
            </h4>
            <p className="text-[11px] text-slate-500">
              یک متن سلیقه امتحانی وارد کنید تا فرآیند کامل انتخاب کاندیداها و پاسخ زنده مدل را همین‌جا مشاهده کنید:
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">حس و حال:</label>
              <select
                value={testMood}
                onChange={(e) => setTestMood(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="laugh">😄 طنز و خنده‌دار</option>
                <option value="adventure">🚀 ماجراجویی و فانتزی</option>
                <option value="mystery">🕵️ معمایی و کارآگاهی</option>
                <option value="thoughtful">💡 انگیزشی و تفکربرانگیز</option>
                <option value="scientific">🔬 دانستنی‌ها و علمی</option>
                <option value="thriller">👻 دلهره‌آور</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">متن دلخواه یا کلمات کلیدی:</label>
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="مثال: کتابی شبیه تام گیتس یا پرسی جکسون"
                className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
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
